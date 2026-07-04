import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  DoorOpen,
  Eye,
  EyeOff,
  LogIn,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { usePlanningPokerRoom } from './usePlanningPokerRoom.js';

const STORAGE_KEY = 'planning-poker-state-v1';
const DECKS = {
  fibonacci: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '?', '☕'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
};
const DEFAULT_CUSTOM_DECK = '0, 1, 2, 3, 5, 8, 13, ?';

const emptyState = {
  topic: 'Refinar historia do backlog',
  deck: 'fibonacci',
  customDeckText: DEFAULT_CUSTOM_DECK,
  activeParticipantId: null,
  isRevealed: false,
  round: 1,
  participants: [],
};

const initialState = {
  ...emptyState,
  activeParticipantId: 'p1',
  participants: [
    { id: 'p1', name: 'Ana', vote: null, connectionStatus: 'local' },
    { id: 'p2', name: 'Bruno', vote: null, connectionStatus: 'local' },
    { id: 'p3', name: 'Carla', vote: null, connectionStatus: 'local' },
  ],
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
  } catch {
    return initialState;
  }
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function randomParticipantId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createRoomUrl(roomCode) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomCode);
  return url.toString();
}

function initialOnlineState(localParticipant) {
  return {
    ...emptyState,
    activeParticipantId: localParticipant.id,
    participants: [localParticipant],
  };
}

function voteLabel(vote, isRevealed, connectionStatus) {
  if (connectionStatus === 'offline') return 'Offline';
  if (!vote) return 'Aguardando';
  return isRevealed ? vote : 'Votou';
}

function numericVote(vote) {
  if (vote === null || vote === '?' || vote === '☕') return null;
  const parsed = Number(String(vote).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCustomDeck(customDeckText) {
  const cards = customDeckText
    .split(/[\s,;]+/)
    .map((card) => card.trim())
    .filter(Boolean);

  return [...new Set(cards)];
}

function clearParticipantVotes(participants) {
  return participants.map((participant) => ({
    ...participant,
    vote: null,
  }));
}

function SetupScreen({ onCreateRoom, onJoinRoom, onStartLocal }) {
  const queryRoomCode = new URLSearchParams(window.location.search).get('room') ?? '';
  const [setupView, setSetupView] = useState(queryRoomCode ? 'join' : 'choice');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [roomCode, setRoomCode] = useState(queryRoomCode.toUpperCase());
  const [roomCodeError, setRoomCodeError] = useState('');

  function validateName() {
    if (name.trim()) {
      setNameError('');
      return true;
    }

    setNameError('Informe seu nome para continuar.');
    return false;
  }

  function validateRoomCode() {
    if (roomCode.trim()) {
      setRoomCodeError('');
      return true;
    }

    setRoomCodeError('Informe o codigo da sala para continuar.');
    return false;
  }

  function submitCreate(event) {
    event.preventDefault();
    if (!validateName()) return;
    onCreateRoom(name.trim());
  }

  function submitJoin(event) {
    event.preventDefault();
    const hasName = validateName();
    const hasRoomCode = validateRoomCode();
    if (!hasName || !hasRoomCode) return;
    onJoinRoom(name.trim(), roomCode.trim().toUpperCase());
  }

  function resetSetupForm(nextView) {
    setNameError('');
    setRoomCodeError('');
    setSetupView(nextView);
  }

  const nameField = (
    <label className="topic-field">
      <span>Seu nome</span>
      <input
        type="text"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (event.target.value.trim()) {
            setNameError('');
          }
        }}
        placeholder="Ex: Fulano"
        aria-invalid={Boolean(nameError)}
        aria-describedby={nameError ? 'name-error' : undefined}
        required
      />
      {nameError && (
        <small className="field-error" id="name-error">
          {nameError}
        </small>
      )}
    </label>
  );

  return (
    <main className="setup-shell">
      <section className="setup-panel" aria-label="Entrar no planning poker">
        <div>
          <p className="eyebrow">Planning Poker</p>
          <h1>
            {setupView === 'create'
              ? 'Criar sessao'
              : setupView === 'join'
                ? 'Entrar como convidado'
                : 'Sala de estimativas'}
          </h1>
        </div>

        {setupView === 'choice' && (
          <>
            <div className="mode-grid">
              <button
                className="setup-box setup-choice"
                type="button"
                onClick={() => resetSetupForm('create')}
              >
                <div>
                  <h2>Criar sessao</h2>
                  <p>Abra uma sala e compartilhe o codigo com o time.</p>
                </div>
                <span className="choice-command">
                  <Plus size={18} />
                  Criar
                </span>
              </button>

              <button
                className="setup-box setup-choice"
                type="button"
                onClick={() => resetSetupForm('join')}
              >
                <div>
                  <h2>Entrar como convidado</h2>
                  <p>Use o codigo enviado pelo host da rodada.</p>
                </div>
                <span className="choice-command secondary-command">
                  <LogIn size={18} />
                  Entrar
                </span>
              </button>
            </div>

            <button className="text-button" type="button" onClick={onStartLocal}>
              Usar no mesmo navegador
            </button>
          </>
        )}

        {setupView === 'create' && (
          <form className="setup-form" onSubmit={submitCreate} noValidate>
            {nameField}
            <div className="setup-actions">
              <button
                className="icon-button secondary"
                type="button"
                onClick={() => resetSetupForm('choice')}
              >
                <ArrowLeft size={18} />
                <span>Voltar</span>
              </button>
              <button className="icon-button primary" type="submit">
                <Plus size={18} />
                <span>Criar sala</span>
              </button>
            </div>
          </form>
        )}

        {setupView === 'join' && (
          <form className="setup-form" onSubmit={submitJoin} noValidate>
            {nameField}
            <label className="topic-field">
              <span>Codigo</span>
              <input
                type="text"
                value={roomCode}
                onChange={(event) => {
                  setRoomCode(event.target.value.toUpperCase());
                  if (event.target.value.trim()) {
                    setRoomCodeError('');
                  }
                }}
                placeholder="ABC123"
                maxLength={12}
                aria-invalid={Boolean(roomCodeError)}
                aria-describedby={roomCodeError ? 'room-code-error' : undefined}
                required
              />
              {roomCodeError && (
                <small className="field-error" id="room-code-error">
                  {roomCodeError}
                </small>
              )}
            </label>
            <div className="setup-actions">
              <button
                className="icon-button secondary"
                type="button"
                onClick={() => resetSetupForm('choice')}
              >
                <ArrowLeft size={18} />
                <span>Voltar</span>
              </button>
              <button className="icon-button primary" type="submit">
                <LogIn size={18} />
                <span>Entrar</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function App() {
  const [mode, setMode] = useState('setup');
  const [state, setState] = useState(loadState);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [localParticipant, setLocalParticipant] = useState(null);
  const [copied, setCopied] = useState(false);

  const { connectionStatus, connectionError, sendToHost } = usePlanningPokerRoom({
    mode,
    roomCode,
    localParticipant,
    state,
    setState,
  });

  const deckCards =
    state.deck === 'custom'
      ? parseCustomDeck(state.customDeckText ?? DEFAULT_CUSTOM_DECK)
      : DECKS[state.deck] ?? DECKS.fibonacci;
  const activeParticipant = state.participants.find(
    (participant) => participant.id === state.activeParticipantId,
  );
  const isGuest = mode === 'guest';
  const isOnline = mode === 'host' || mode === 'guest';
  const canManageRound = mode !== 'guest';
  const shareUrl = roomCode ? createRoomUrl(roomCode) : '';

  const stats = useMemo(() => {
    const votes = state.participants.map((participant) => participant.vote).filter(Boolean);
    const numericVotes = votes.map(numericVote).filter((vote) => vote !== null);
    const distribution = deckCards.map((card) => ({
      card,
      count: votes.filter((vote) => vote === card).length,
    }));
    const total = numericVotes.reduce((sum, vote) => sum + vote, 0);
    const average = numericVotes.length ? total / numericVotes.length : null;
    const sorted = [...numericVotes].sort((a, b) => a - b);
    const median =
      sorted.length === 0
        ? null
        : sorted.length % 2
          ? sorted[Math.floor(sorted.length / 2)]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    const maxDistribution = Math.max(0, ...distribution.map((item) => item.count));
    const topVote = distribution.reduce(
      (best, item) => (item.count > best.count ? item : best),
      { card: '-', count: 0 },
    );

    return {
      average,
      median,
      distribution,
      maxDistribution,
      topVote,
      votedCount: votes.length,
    };
  }, [deckCards, state.participants]);

  useEffect(() => {
    if (mode === 'local') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [mode, state]);

  function patchState(next) {
    if (isGuest) return;
    setState((current) => ({ ...current, ...next }));
  }

  function changeDeck(deck) {
    setState((current) => ({
      ...current,
      deck,
      isRevealed: false,
      participants: clearParticipantVotes(current.participants),
    }));
  }

  function changeCustomDeck(customDeckText) {
    setState((current) => ({
      ...current,
      deck: 'custom',
      customDeckText,
      isRevealed: false,
      participants: clearParticipantVotes(current.participants),
    }));
  }

  function startLocal() {
    setMode('local');
    setRoomCode('');
    setLocalParticipant(null);
    setState(loadState());
  }

  function createRoom(name) {
    const host = {
      id: randomParticipantId('host'),
      name,
      vote: null,
      isHost: true,
      connectionStatus: 'online',
    };
    const nextRoomCode = randomRoomCode();

    setLocalParticipant(host);
    setRoomCode(nextRoomCode);
    setState(initialOnlineState(host));
    setMode('host');
    window.history.replaceState(null, '', `?room=${nextRoomCode}`);
  }

  function joinRoom(name, nextRoomCode) {
    const participant = {
      id: randomParticipantId('guest'),
      name,
      vote: null,
      isHost: false,
      connectionStatus: 'online',
    };

    setLocalParticipant(participant);
    setRoomCode(nextRoomCode);
    setState(initialOnlineState(participant));
    setMode('guest');
    window.history.replaceState(null, '', `?room=${nextRoomCode}`);
  }

  function leaveRoom() {
    setMode('setup');
    setRoomCode('');
    setLocalParticipant(null);
    setCopied(false);
    setState(loadState());
    window.history.replaceState(null, '', window.location.pathname);
  }

  function castVote(card) {
    if (!activeParticipant) return;

    if (isGuest) {
      setState((current) => ({
        ...current,
        isRevealed: false,
        participants: current.participants.map((participant) =>
          participant.id === activeParticipant.id ? { ...participant, vote: card } : participant,
        ),
      }));
      sendToHost({ type: 'vote', participantId: activeParticipant.id, vote: card });
      return;
    }

    setState((current) => ({
      ...current,
      isRevealed: false,
      participants: current.participants.map((participant) =>
        participant.id === current.activeParticipantId
          ? { ...participant, vote: card }
          : participant,
      ),
    }));
  }

  function addParticipant(event) {
    event.preventDefault();
    const name = newParticipantName.trim();
    if (!name || mode !== 'local') return;

    const participant = {
      id: `p-${Date.now()}`,
      name,
      vote: null,
      connectionStatus: 'local',
    };

    setState((current) => ({
      ...current,
      activeParticipantId: participant.id,
      participants: [...current.participants, participant],
    }));
    setNewParticipantName('');
  }

  function removeParticipant(participantId) {
    if (isGuest) return;

    setState((current) => {
      const participants = current.participants.filter(
        (participant) => participant.id !== participantId || participant.isHost,
      );
      const activeParticipantId =
        current.activeParticipantId === participantId
          ? participants[0]?.id ?? null
          : current.activeParticipantId;

      return {
        ...current,
        participants,
        activeParticipantId,
      };
    });
  }

  function clearVotes() {
    if (!canManageRound) return;

    setState((current) => ({
      ...current,
      isRevealed: false,
      participants: clearParticipantVotes(current.participants),
    }));
  }

  function nextRound() {
    if (!canManageRound) return;

    setState((current) => ({
      ...current,
      isRevealed: false,
      round: current.round + 1,
      topic: '',
      participants: clearParticipantVotes(current.participants),
    }));
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (mode === 'setup') {
    return (
      <SetupScreen
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onStartLocal={startLocal}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Planning poker">
        {isOnline && (
          <section className="room-strip" aria-label="Sala">
            <div>
              <p className="eyebrow">{mode === 'host' ? 'Host' : 'Participante'}</p>
              <h2>Sala {roomCode}</h2>
            </div>
            <div className="room-actions">
              <span className={`connection-badge ${connectionStatus}`}>
                {connectionStatus === 'online' ? <Wifi size={16} /> : <WifiOff size={16} />}
                {connectionStatus === 'online' ? 'Online' : 'Conectando'}
              </span>
              {mode === 'host' && (
                <button className="icon-button secondary" type="button" onClick={copyShareUrl}>
                  <Copy size={18} />
                  <span>{copied ? 'Copiado' : 'Copiar link'}</span>
                </button>
              )}
              <button className="icon-button secondary" type="button" onClick={leaveRoom}>
                <DoorOpen size={18} />
                <span>Sair</span>
              </button>
            </div>
            {connectionError && <p className="connection-error">{connectionError}</p>}
          </section>
        )}

        <header className="topbar">
          <div>
            <p className="eyebrow">Rodada {state.round}</p>
            <h1>Planning Poker</h1>
          </div>

          <div className="topbar-actions">
            <label className="deck-select">
              <span>Deck</span>
              <select
                value={state.deck}
                disabled={!canManageRound}
                onChange={(event) => changeDeck(event.target.value)}
              >
                <option value="fibonacci">Fibonacci</option>
                <option value="tshirt">T-shirt</option>
                <option value="custom">Customizado</option>
              </select>
            </label>

            <button
              className="icon-button secondary"
              type="button"
              onClick={() => patchState({ isRevealed: !state.isRevealed })}
              title={state.isRevealed ? 'Ocultar votos' : 'Revelar votos'}
              disabled={!canManageRound}
            >
              {state.isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
              <span>{state.isRevealed ? 'Ocultar' : 'Revelar'}</span>
            </button>
          </div>
        </header>

        {state.deck === 'custom' && (
          <section className="custom-deck-panel" aria-label="Deck customizado">
            <label className="topic-field">
              <span>Valores do deck</span>
              <textarea
                value={state.customDeckText}
                onChange={(event) => changeCustomDeck(event.target.value)}
                placeholder="Ex.: 0, 1, 2, 3, 5, 8, 13, ?"
                disabled={!canManageRound}
                rows={3}
              />
            </label>
            <div className="custom-preview" aria-label="Cartas do deck customizado">
              {deckCards.length ? (
                deckCards.map((card) => <span key={card}>{card}</span>)
              ) : (
                <strong>Nenhuma carta configurada</strong>
              )}
            </div>
          </section>
        )}

        <div className="topic-row">
          <label className="topic-field">
            <span>Historia ou tarefa</span>
            <input
              type="text"
              value={state.topic}
              onChange={(event) => patchState({ topic: event.target.value })}
              placeholder="Ex.: Criar fluxo de checkout"
              disabled={!canManageRound}
            />
          </label>
        </div>

        <section className="vote-panel" aria-label="Escolher estimativa">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Votando como</p>
              <h2>{activeParticipant?.name ?? 'Aguardando sala'}</h2>
            </div>
            <div className="status-pill">
              <Check size={16} />
              {stats.votedCount}/{state.participants.length} votos
            </div>
          </div>

          {deckCards.length ? (
            <div className="card-grid">
              {deckCards.map((card) => {
                const isSelected = activeParticipant?.vote === card;
                return (
                  <button
                    className={`poker-card ${isSelected ? 'selected' : ''}`}
                    type="button"
                    key={card}
                    onClick={() => castVote(card)}
                    disabled={!activeParticipant || (isGuest && connectionStatus !== 'online')}
                    aria-pressed={isSelected}
                  >
                    {card}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-deck">Configure ao menos um valor para votar.</div>
          )}
        </section>

        <section className="results-band" aria-label="Resultado da rodada">
          <div className="metric">
            <BarChart3 size={18} />
            <span>Media</span>
            <strong>{state.isRevealed && stats.average !== null ? stats.average.toFixed(1) : '-'}</strong>
          </div>
          <div className="metric">
            <Sparkles size={18} />
            <span>Mediana</span>
            <strong>{state.isRevealed && stats.median !== null ? stats.median : '-'}</strong>
          </div>
          <div className="metric">
            <Users size={18} />
            <span>Mais votado</span>
            <strong>{state.isRevealed && stats.topVote.count > 0 ? stats.topVote.card : '-'}</strong>
          </div>
        </section>

        <section className="distribution" aria-label="Distribuicao de votos">
          {stats.distribution.map((item) => (
            <div className="distribution-row" key={item.card}>
              <span className="distribution-card">{item.card}</span>
              <div className="distribution-track">
                <span
                  style={{
                    width:
                      state.isRevealed && stats.maxDistribution
                        ? `${(item.count / stats.maxDistribution) * 100}%`
                        : '0%',
                  }}
                />
              </div>
              <strong>{state.isRevealed ? item.count : '-'}</strong>
            </div>
          ))}
        </section>

        {canManageRound && (
          <footer className="round-actions">
            <button className="icon-button secondary" type="button" onClick={clearVotes}>
              <RefreshCcw size={18} />
              <span>Limpar votos</span>
            </button>
            <button className="icon-button primary" type="button" onClick={nextRound}>
              <Plus size={18} />
              <span>Nova rodada</span>
            </button>
          </footer>
        )}
      </section>

      <aside className="sidebar" aria-label="Participantes">
        <div className="sidebar-heading">
          <div>
            <p className="eyebrow">Mesa</p>
            <h2>Participantes</h2>
          </div>
          <Users size={20} />
        </div>

        {mode === 'local' && (
          <form className="add-form" onSubmit={addParticipant}>
            <input
              type="text"
              value={newParticipantName}
              onChange={(event) => setNewParticipantName(event.target.value)}
              placeholder="Nome"
              aria-label="Nome do participante"
            />
            <button className="square-button" type="submit" title="Adicionar participante">
              <UserPlus size={18} />
            </button>
          </form>
        )}

        <div className="participant-list">
          {state.participants.map((participant) => (
            <article
              className={`participant-card ${
                participant.id === state.activeParticipantId ? 'active' : ''
              } ${participant.connectionStatus === 'offline' ? 'offline' : ''}`}
              key={participant.id}
            >
              <button
                className="participant-main"
                type="button"
                onClick={() => mode === 'local' && patchState({ activeParticipantId: participant.id })}
                disabled={mode !== 'local'}
              >
                <span className="avatar">{participant.name.slice(0, 1).toUpperCase()}</span>
                <span>
                  <strong>{participant.name}</strong>
                  <small>
                    {voteLabel(
                      participant.vote,
                      state.isRevealed,
                      participant.connectionStatus,
                    )}
                  </small>
                </span>
              </button>
              {canManageRound && !participant.isHost && (
                <button
                  className="ghost-icon"
                  type="button"
                  title={`Remover ${participant.name}`}
                  onClick={() => removeParticipant(participant.id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </article>
          ))}
        </div>
      </aside>
    </main>
  );
}

export default App;
