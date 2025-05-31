import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useEffect, useRef } from 'react';
import '@xterm/xterm/css/xterm.css';

const WEBSOCKET_URL = 'ws://127.0.0.1:8000/ws/terminal/';

function TerminalComponent() {
  const terminalRef = useRef(null);
  const termInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const xtermKeyListenerRef = useRef(null);
  const inputBufferRef = useRef('');

  useEffect(() => {
    if (!terminalRef.current) {
      return;
    }

    if (!termInstanceRef.current) {
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

			console.log("React app - Xterm options applied:", term.options.fontFamily, term.options.letterSpacing);
      const fitAddon = new FitAddon();
      termInstanceRef.current = term;
      fitAddonRef.current = fitAddon;
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();
      term.focus();
    }

    const term = termInstanceRef.current;

    if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED || socketRef.current.readyState === WebSocket.CLOSING) {
      inputBufferRef.current = '';

      const socket = new WebSocket(WEBSOCKET_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connection established');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.output) {
            term.write(data.output);
          } else if (data.message) {
            term.write(`${data.message}\r\n`);
          } else if (data.error) {
          }
        } catch (e) {
          term.write(event.data);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
      };
    }

    if (xtermKeyListenerRef.current) {
      xtermKeyListenerRef.current.dispose();
    }

    xtermKeyListenerRef.current = term.onKey(({ key, domEvent }) => {
      const isPrintable = !domEvent.altKey && !domEvent.metaKey && !domEvent.ctrlKey;

      if (domEvent.key === 'Enter') {
        // term.write('\r\n');
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(inputBufferRef.current + '\n'); // Send buffered line with newline
        } else {
          term.writeln('\r\n[No connection] Command not sent.');
        }
        inputBufferRef.current = '';
      } else if (domEvent.key === 'Backspace') {
        if (inputBufferRef.current.length > 0) {
          term.write('\b \b');
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
        }
      } else if (isPrintable && domEvent.key.length === 1) {
        inputBufferRef.current += key;
        term.write(key);
      } else {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(key);
        } else if (key.length > 0){
            term.writeln(`\r\n[No connection] Input not sent: ${key.length > 10 ? key.substring(0,10)+'...' : key}`);
        }
      }
    });

    const handleResize = () => {
      if (fitAddonRef.current && termInstanceRef.current && termInstanceRef.current.element) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          console.warn("FitAddon fit error during resize:", e);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    const resizeTimeout = setTimeout(() => handleResize(), 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      if (xtermKeyListenerRef.current) {
        xtermKeyListenerRef.current.dispose();
        xtermKeyListenerRef.current = null;
      }
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
          socketRef.current.close(1000, "Terminal component unmounted");
        }
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default TerminalComponent;