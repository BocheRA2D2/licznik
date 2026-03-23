
import React from 'react';
import { type ClimbSegment } from '../utils/climb';
import { type Point } from '../utils/geo';
import { Mountain } from 'lucide-react';

interface ClimbViewProps {
  climb: ClimbSegment;
  userPosition: Point | null;
}

const ClimbView: React.FC<ClimbViewProps> = ({ climb, userPosition }) => {
  const maxElev = Math.max(...climb.points.map(p => p.altitude || 0));
  const minElev = Math.min(...climb.points.map(p => p.altitude || 0));
  const elevRange = maxElev - minElev || 1;

  // Find user's progress in the climb
  let progressIdx = 0;
  if (userPosition) {
     let minD = Infinity;
     climb.points.forEach((p, idx) => {
        const d = Math.sqrt(Math.pow(p.lat - userPosition.lat, 2) + Math.pow(p.lng - userPosition.lng, 2));
        if(d < minD) {
            minD = d;
            progressIdx = idx;
        }
     });
  }

  const remainingGain = (climb.points[climb.points.length - 1].altitude || 0) - (climb.points[progressIdx].altitude || 0);

  return (
    <div className="metric-card" style={{ 
      backgroundColor: 'rgba(30, 41, 59, 0.9)', 
      border: '2px solid #f59e0b', 
      boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
          <Mountain size={20} />
          <span style={{ fontWeight: 'bold' }}>PODJAZD WYKRYTY!</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Sr. {climb.averageGradient.toFixed(1)}%</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
         <div className="metric-small">
            <span className="metric-label" style={{ fontSize: '0.6rem' }}>Do szczytu (gain)</span>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{Math.max(0, remainingGain).toFixed(0)}m</div>
         </div>
         <div className="metric-small">
            <span className="metric-label" style={{ fontSize: '0.6rem' }}>Szczyt</span>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{(climb.points[climb.points.length-1].altitude || 0).toFixed(0)}m</div>
         </div>
      </div>

      {/* Simple Elevation Profile Chart */}
      <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', gap: '2px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '4px' }}>
        {climb.points.filter((_, i) => i % 5 === 0).map((p, i, arr) => {
           const h = (((p.altitude || 0) - minElev) / elevRange) * 100;
           const isUserPast = (i / arr.length) <= (progressIdx / climb.points.length);
           return (
             <div 
               key={i} 
               style={{ 
                 flex: 1, 
                 height: `${Math.max(5, h)}%`, 
                 backgroundColor: isUserPast ? '#f59e0b' : '#475569',
                 borderRadius: '2px 2px 0 0',
                 transition: 'background-color 0.3s'
               }}
             />
           );
        })}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
         Dystans podjazdu: {(climb.distance / 1000).toFixed(2)} km
      </div>
    </div>
  );
};

export default ClimbView;
