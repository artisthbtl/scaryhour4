import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';

const TerminalComponent = () => {
    const terminalContainerRef = useRef(null);
    const termInstanceRef = useRef(null);
    const websocketRef = useRef(null);
    const fitAddonInstanceRef = useRef(null);

    const debounce = (func, wait_ms) => {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait_ms);
        };
    };

    const fitTerminalToScreen = () => {
        if (fitAddonInstanceRef.current && termInstanceRef.current && termInstanceRef.current._core) {
            try {
                fitAddonInstanceRef.current.fit();
                const dims = { cols: termInstanceRef.current.cols, rows: termInstanceRef.current.rows };
                if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                    websocketRef.current.send(JSON.stringify({ type: "resize", ...dims }));
                }
            } catch (e) {
                console.warn("Error fitting to screen or sending resize:", e);
            }
        }
    };
    
    const customKeyEventHandler = (e) => {
        if (e.type !== "keydown") {
            return true;
        }
        if (e.ctrlKey && e.shiftKey && termInstanceRef.current) {
            const key = e.key.toLowerCase();
            if (key === "v") {
                navigator.clipboard.readText().then((toPaste) => {
                    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                        websocketRef.current.send(JSON.stringify({ type: "input", input: toPaste }));
                    }
                });
                return false; 
            } else if (key === "c" || key === "x") {
                const toCopy = termInstanceRef.current.getSelection();
                if (toCopy) {
                    navigator.clipboard.writeText(toCopy);
                    termInstanceRef.current.focus();
                }
                return false;
            }
        }
        return true;
    };


    useEffect(() => {
        if (!terminalContainerRef.current || termInstanceRef.current) {
            return;
        }

        if (!fitAddonInstanceRef.current) {
            fitAddonInstanceRef.current = new FitAddon();
        }

        const term = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: "'IBM Plex Mono', Consolas, 'Courier New', monospace",
          theme: {
            background: '#0c030f',
            foreground: '#F0F0F0',
            cursor: '#F0F0F0',
            selectionBackground: '#404040',
          },
        });
        termInstanceRef.current = term;

        term.loadAddon(fitAddonInstanceRef.current);
        term.loadAddon(new WebLinksAddon());
        term.loadAddon(new SearchAddon());

        term.open(terminalContainerRef.current);

        const initialFitTimeoutId = setTimeout(() => {
            if (termInstanceRef.current === term && terminalContainerRef.current && document.body.contains(terminalContainerRef.current)) {
                try {
                    console.log("Attempting initial fit...");
                    fitTerminalToScreen();
                } catch (e) {
                    console.warn("Initial fit failed:", e);
                }
            }
        }, 50);
        
        term.attachCustomKeyEventHandler(customKeyEventHandler);

        const socketUrl = 'ws://127.0.0.1:8000/ws/terminal/';
        const ws = new WebSocket(socketUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected");
            if (termInstanceRef.current === term) {
                 fitTerminalToScreen();
            }
            term.focus();
        };

        ws.onclose = (event) => {
            console.log("WebSocket disconnected:", event.reason || "No reason", "Code:", event.code);
            if (termInstanceRef.current === term) term.writeln("\r\n\n--- WebSocket Disconnected ---");
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            if (termInstanceRef.current === term) term.writeln("\r\n\n--- WebSocket Error ---");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'ping') {
                    console.log("Received ping, sending pong.");
                    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                        websocketRef.current.send(JSON.stringify({ type: 'pong' }));
                    }
                    return;
                }

                if (termInstanceRef.current === term) {
                    if (data.output) {
                        term.write(data.output);
                    } else if (data.error) {
                        term.writeln(`\r\n\n<Error from server: ${data.error}>`);
                    } else if (data.type === "status" && data.message) {
                        term.writeln(`${data.message}`);
                    }
                }
            } catch (e) {
                console.error("Failed to parse server message or write to terminal:", e);
            }
        };

        const onDataDisposable = term.onData((data) => {
            if (websocketRef.current === ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "input", input: data }));
            }
        });

        const debouncedFitHandler = debounce(fitTerminalToScreen, 150);
        window.addEventListener('resize', debouncedFitHandler);

        return () => {
            console.log("TerminalComponent unmounting: Cleaning up...");
            clearTimeout(initialFitTimeoutId);
            window.removeEventListener('resize', debouncedFitHandler);

            if (onDataDisposable) {
                onDataDisposable.dispose();
            }
            if (websocketRef.current) {
                websocketRef.current.onopen = null;
                websocketRef.current.onclose = null;
                websocketRef.current.onerror = null;
                websocketRef.current.onmessage = null;
                if (websocketRef.current.readyState === WebSocket.OPEN || websocketRef.current.readyState === WebSocket.CONNECTING) {
                    websocketRef.current.close();
                }
                websocketRef.current = null;
            }
            if (termInstanceRef.current === term) {
                term.dispose();
                termInstanceRef.current = null;
            }
        };
    }, []);

    return (
      <div ref={terminalContainerRef} style={{ height: '83vh', width: '100%' }} />
    );
};

export default TerminalComponent;