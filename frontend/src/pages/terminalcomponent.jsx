import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { ACCESS_TOKEN } from '../constant';
import '@xterm/xterm/css/xterm.css';

const TerminalComponent = ({ sessionId, setGuideSteps, setIsGuiding }) => {
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
				
				if (key === "c" || key === "x") {
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
        if (!terminalContainerRef.current || !sessionId) {
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
        term.attachCustomKeyEventHandler(customKeyEventHandler);

        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            console.error("No auth token found, cannot connect WebSocket.");
            term.writeln("\r\n\n--- Authentication Error: Not logged in ---");
            return;
        }

        const socketUrl = `ws://127.0.0.1:8000/ws/terminal/${sessionId}/?token=${token}`;
        const ws = new WebSocket(socketUrl);
        websocketRef.current = ws;

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

        ws.onopen = () => {
            console.log("WebSocket connected for session:", sessionId);
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
        
        const hasFittedOnFirstMessage = { current: false };
        ws.onmessage = (event) => {
            const hasFittedOnFirstMessage = { current: false };
            if (!hasFittedOnFirstMessage.current) {
                fitTerminalToScreen();
                hasFittedOnFirstMessage.current = true;
            }
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'show_guide') {
                    console.log("Received show_guide trigger from backend:", data.steps);
                    setGuideSteps(data.steps);
                    setIsGuiding(true);
                    return;
                }

                if (data.type === 'ping') {
                    return;
                }

                if (termInstanceRef.current === term) {
                    if (data.output) {
                        term.write(data.output);
                    } else if (data.error) {
                        term.writeln(`\r\n\n<Error from server: ${data.error}>`);
                    } else if (data.message) {
                        term.writeln(`\r\n\x1b[32m[System]: ${data.message}\x1b[0m\r\n`);
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
            console.log("TerminalComponent unmounting: Cleaning up session", sessionId);
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
    }, [sessionId, setGuideSteps, setIsGuiding]);

    return (
      <div ref={terminalContainerRef} style={{ height: '83vh', width: '100%' }} />
    );
};

export default TerminalComponent;