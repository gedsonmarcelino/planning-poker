import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

function roomPeerId(roomCode) {
  return `planning-poker-${roomCode.toLowerCase()}`;
}

function cleanParticipant(participant) {
  return {
    id: participant.id,
    name: participant.name,
    vote: participant.vote ?? null,
    isHost: Boolean(participant.isHost),
    connectionStatus: participant.connectionStatus ?? 'online',
  };
}

function sendConnection(connection, message) {
  if (connection?.open) {
    connection.send(message);
  }
}

export function usePlanningPokerRoom({ mode, roomCode, localParticipant, state, setState }) {
  const peerRef = useRef(null);
  const hostConnectionRef = useRef(null);
  const guestConnectionsRef = useRef(new Map());
  const connectionParticipantsRef = useRef(new Map());
  const stateRef = useRef(state);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [connectionError, setConnectionError] = useState('');

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const broadcastState = useCallback((nextState = stateRef.current) => {
    guestConnectionsRef.current.forEach((connection) => {
      sendConnection(connection, { type: 'state', state: nextState });
    });
  }, []);

  const sendToHost = useCallback((message) => {
    sendConnection(hostConnectionRef.current, message);
  }, []);

  useEffect(() => {
    if (mode !== 'host' || !roomCode || !localParticipant) return undefined;

    setConnectionStatus('connecting');
    setConnectionError('');

    const peer = new Peer(roomPeerId(roomCode));
    peerRef.current = peer;

    peer.on('open', () => {
      setConnectionStatus('online');
    });

    peer.on('connection', (connection) => {
      guestConnectionsRef.current.set(connection.peer, connection);

      connection.on('data', (message) => {
        if (message?.type === 'join' && message.participant) {
          const participant = cleanParticipant(message.participant);
          connectionParticipantsRef.current.set(connection.peer, participant.id);

          setState((current) => {
            const exists = current.participants.some((item) => item.id === participant.id);
            const participants = exists
              ? current.participants.map((item) =>
                  item.id === participant.id
                    ? { ...item, name: participant.name, connectionStatus: 'online' }
                    : item,
                )
              : [...current.participants, participant];
            const nextState = { ...current, participants };
            sendConnection(connection, { type: 'state', state: nextState });
            return nextState;
          });
        }

        if (message?.type === 'vote' && message.participantId) {
          setState((current) => ({
            ...current,
            isRevealed: false,
            participants: current.participants.map((participant) =>
              participant.id === message.participantId
                ? { ...participant, vote: message.vote ?? null, connectionStatus: 'online' }
                : participant,
            ),
          }));
        }
      });

      connection.on('close', () => {
        const participantId = connectionParticipantsRef.current.get(connection.peer);
        guestConnectionsRef.current.delete(connection.peer);
        connectionParticipantsRef.current.delete(connection.peer);

        if (participantId) {
          setState((current) => ({
            ...current,
            participants: current.participants.map((participant) =>
              participant.id === participantId
                ? { ...participant, connectionStatus: 'offline' }
                : participant,
            ),
          }));
        }
      });
    });

    peer.on('error', (error) => {
      setConnectionStatus('error');
      setConnectionError(error?.message ?? 'Nao foi possivel abrir a sala.');
    });

    return () => {
      guestConnectionsRef.current.forEach((connection) => connection.close());
      guestConnectionsRef.current.clear();
      connectionParticipantsRef.current.clear();
      peer.destroy();
      peerRef.current = null;
      setConnectionStatus('offline');
    };
  }, [localParticipant, mode, roomCode, setState]);

  useEffect(() => {
    if (mode !== 'guest' || !roomCode || !localParticipant) return undefined;

    setConnectionStatus('connecting');
    setConnectionError('');

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const connection = peer.connect(roomPeerId(roomCode), { reliable: true });
      hostConnectionRef.current = connection;

      connection.on('open', () => {
        setConnectionStatus('online');
        sendConnection(connection, {
          type: 'join',
          participant: cleanParticipant(localParticipant),
        });
      });

      connection.on('data', (message) => {
        if (message?.type === 'state' && message.state) {
          setState({
            ...message.state,
            activeParticipantId: localParticipant.id,
          });
        }
      });

      connection.on('close', () => {
        setConnectionStatus('offline');
        setConnectionError('A conexao com o host foi encerrada.');
      });
    });

    peer.on('error', (error) => {
      setConnectionStatus('error');
      setConnectionError(error?.message ?? 'Nao foi possivel entrar na sala.');
    });

    return () => {
      hostConnectionRef.current?.close();
      hostConnectionRef.current = null;
      peer.destroy();
      peerRef.current = null;
      setConnectionStatus('offline');
    };
  }, [localParticipant, mode, roomCode, setState]);

  useEffect(() => {
    if (mode === 'host' && connectionStatus === 'online') {
      broadcastState(state);
    }
  }, [broadcastState, connectionStatus, mode, state]);

  return {
    connectionStatus,
    connectionError,
    sendToHost,
  };
}
