
import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import ClimbView from './components/ClimbView';
import { useBikeComputer } from './hooks/useBikeComputer';
import { useGhostRace } from './hooks/useGhostRace';
import { formatTime, formatDistance, type Track } from './utils/geo';
import { findClimbs, isInsideClimb, type ClimbSegment } from './utils/climb';
import { Play, Square, History } from 'lucide-react';

const App: React.FC = () => {
  const {
    isTracking,
    currentPosition,
    path,
    distance,
    speed,
    elapsedTime,
    startTracking,
    stopTracking,
  } = useBikeComputer();

  const [ghostTrack, setGhostTrack] = useState<Track | null>(null);
  const [isRacing, setIsRacing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [savedTracks, setSavedTracks] = useState<Track[]>([]);
  const [climbs, setClimbs] = useState<ClimbSegment[]>([]);
  const [activeClimb, setActiveClimb] = useState<ClimbSegment | null>(null);

  const { ghostPosition, timeGap, distanceGap } = useGhostRace(
    ghostTrack,
    isRacing,
    elapsedTime,
    currentPosition
  );

  // Load tracks from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem('bike_tracks');
    if (saved) {
      setSavedTracks(JSON.parse(saved));
    }
  }, []);

  // Pre-calculate climbs when ghost track changes
  useEffect(() => {
    if (ghostTrack) {
      setClimbs(findClimbs(ghostTrack.points));
    } else {
      setClimbs([]);
    }
  }, [ghostTrack]);

  // Detect if user is in a climb
  useEffect(() => {
    if (isRacing && currentPosition && climbs.length > 0) {
      setActiveClimb(isInsideClimb(currentPosition, climbs));
    } else {
      setActiveClimb(null);
    }
  }, [isRacing, currentPosition, climbs]);

  const handleStart = () => {
    if (ghostTrack) {
        setIsRacing(true);
    }
    startTracking();
  };

  const handleStop = () => {
    stopTracking();
    setIsRacing(false);
    
    // Auto-save if distance > 10m
    if (path.length > 5 && distance > 10) {
        const newTrack: Track = {
            id: Date.now().toString(),
            name: `Trasa ${new Date().toLocaleDateString()}`,
            date: Date.now(),
            points: path,
            distance: distance,
            duration: elapsedTime
        };
        const updated = [newTrack, ...savedTracks];
        setSavedTracks(updated);
        localStorage.setItem('bike_tracks', JSON.stringify(updated));
        alert('Trasa zapisana!');
    }
  };

  const selectGhost = (track: Track) => {
      setGhostTrack(track);
      setShowLibrary(false);
      alert(`Wczytano ducha: ${track.name}`);
  };

  return (
    <div className="app-container">
      {/* Header / Dashboard */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <span className="metric-label">Prędkość</span>
          <span className="metric-value">
            {speed.toFixed(1)}
            <span className="metric-unit">km/h</span>
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Czas</span>
          <span className="metric-value">{formatTime(elapsedTime)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Dystans</span>
          <span className="metric-value">
            {formatDistance(distance)}
            <span className="metric-unit">km</span>
          </span>
        </div>
        <div className="metric-card" onClick={() => setShowLibrary(true)}>
          <span className="metric-label">Duch</span>
          <span className="metric-value" style={{ fontSize: '1rem', color: ghostTrack ? '#3b82f6' : '#94a3b8' }}>
            {ghostTrack ? ghostTrack.name : 'Brak'}
          </span>
        </div>

        {/* ClimbPro View */}
        {activeClimb && (
          <div style={{ gridColumn: 'span 2' }}>
             <ClimbView climb={activeClimb} userPosition={currentPosition} />
          </div>
        )}

        {/* Ghost Race Stats */}
        {isRacing && ghostTrack && (
          <div className="metric-card ghost-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-label">Wyścig z duchem</span>
                <span className={`metric-value ${timeGap <= 0 ? 'ghost-lead' : 'ghost-lag'}`}>
                    {timeGap <= 0 ? '-' : '+'}{formatTime(Math.abs(timeGap))}
                </span>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-dim)' }}>
                 Dystans do ducha: {distanceGap.toFixed(1)} m
            </div>
          </div>
        )}
      </div>

      {/* Map View */}
      <div className="map-container-wrapper">
        {isTracking && (
            <div className="record-indicator">
                <div className="dot"></div>
                REC
            </div>
        )}
        <Map 
          currentPosition={currentPosition} 
          path={path} 
          ghostPosition={ghostPosition}
          ghostPath={ghostTrack?.points}
        />
      </div>

      {/* Controls */}
      <div className="controls">
        {!isTracking ? (
          <button className="btn btn-primary" onClick={handleStart}>
            <Play size={24} fill="white" />
            {ghostTrack ? 'START WYŚCIGU' : 'NAGRYWAJ TRASĘ'}
          </button>
        ) : (
          <button className="btn btn-stop" onClick={handleStop}>
            <Square size={24} fill="white" />
            STOP
          </button>
        )}
        
        {!isTracking && savedTracks.length > 0 && (
            <button className="btn" style={{ marginLeft: '12px', background: 'var(--card-dark)' }} onClick={() => setShowLibrary(!showLibrary)}>
                <History size={24} />
            </button>
        )}
      </div>

      {/* Library Modal (Simulated) */}
      {showLibrary && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 2000, padding: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>Twoje Trasy</h2>
                  <button onClick={() => setShowLibrary(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem' }}>×</button>
              </div>
              {savedTracks.map(track => (
                  <div key={track.id} className="metric-card" style={{ marginBottom: '12px', cursor: 'pointer' }} onClick={() => selectGhost(track)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>{track.name}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{new Date(track.date).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginTop: '8px', display: 'flex', gap: '15px' }}>
                          <span>{formatDistance(track.distance)} km</span>
                          <span>{formatTime(track.duration)}</span>
                      </div>
                  </div>
              ))}
              {savedTracks.length === 0 && (
                  <div style={{ textAlign: 'center', marginTop: '40px' }}>
                      <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>Brak zapisanych tras.</p>
                      <button 
                        className="btn btn-primary" 
                        style={{ margin: '0 auto' }}
                        onClick={() => {
                            const testTrack: Track = {
                                id: 'test-1',
                                name: 'Testowa Trasa (Warszawa)',
                                date: Date.now(),
                                points: [
                                    { lat: 52.2297, lng: 21.0122, timestamp: Date.now(), altitude: 100 },
                                    { lat: 52.2307, lng: 21.0132, timestamp: Date.now() + 5000, altitude: 110 },
                                    { lat: 52.2317, lng: 21.0142, timestamp: Date.now() + 10000, altitude: 125 },
                                    { lat: 52.2327, lng: 21.0152, timestamp: Date.now() + 15000, altitude: 140 }
                                ],
                                distance: 500,
                                duration: 15
                            };
                            selectGhost(testTrack);
                        }}
                      >
                        ZAŁADUJ TRASĘ TESTOWĄ
                      </button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default App;
