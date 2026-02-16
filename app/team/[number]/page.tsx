'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, TrendingUp, Trophy, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import { fetchTeamsWithRankings, TeamWithRanking } from '@/lib/ftc-api';
import { getTeamScoutingData, saveTeamScoutingData, ScoutingData } from '@/lib/storage';

// Dynamic import to avoid SSR issues with Konva
const DrawingCanvas = dynamic(() => import('@/components/DrawingCanvas'), {
  ssr: false,
  loading: () => <div className="cyber-card h-96 flex items-center justify-center">
    <p className="text-gray-500">Loading canvas...</p>
  </div>
});

export default function TeamPage({ params }: { params: { number: string } }) {
  const router = useRouter();
  const teamNumber = parseInt(params.number);
  
  const [team, setTeam] = useState<TeamWithRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [drawingData, setDrawingData] = useState<string | undefined>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        const teams = await fetchTeamsWithRankings();
        const foundTeam = teams.find(t => t.teamNumber === teamNumber);
        setTeam(foundTeam || null);
        
        // Load scouting data
        const scoutingData = getTeamScoutingData(teamNumber);
        if (scoutingData) {
          setNotes(scoutingData.notes);
          setDrawingData(scoutingData.drawingDataURL);
        }
      } catch (err) {
        console.error('Failed to load team data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [teamNumber]);

  const handleSave = () => {
    const scoutingData: ScoutingData = {
      teamNumber,
      notes,
      drawingDataURL: drawingData,
      lastModified: new Date().toISOString(),
    };
    
    saveTeamScoutingData(scoutingData);
    setSaveStatus('saving');
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleDrawingSave = (dataURL: string) => {
    setDrawingData(dataURL);
    const scoutingData: ScoutingData = {
      teamNumber,
      notes,
      drawingDataURL: dataURL,
      lastModified: new Date().toISOString(),
    };
    saveTeamScoutingData(scoutingData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-blue mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="cyber-card max-w-md w-full text-center">
          <div className="text-red-400 text-5xl mb-4">⚠</div>
          <h2 className="text-xl font-display text-red-400 mb-2">Team Not Found</h2>
          <p className="text-gray-400 mb-4">Team #{teamNumber} could not be found.</p>
          <button onClick={() => router.push('/')} className="cyber-button">
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <button
          onClick={() => router.push('/')}
          className="cyber-button-secondary flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </button>

        <div className="cyber-card">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl font-display font-bold text-cyber-blue glow-text">
                  #{team.teamNumber}
                </span>
                {team.ranking && (
                  <span className={`cyber-badge ${
                    team.ranking.rank === 1 ? 'cyber-badge-pink' :
                    team.ranking.rank <= 4 ? 'cyber-badge-blue' :
                    'cyber-badge-green'
                  }`}>
                    Rank {team.ranking.rank}
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{team.nameShort || team.nameFull}</h1>
              {team.nameShort && team.nameFull && team.nameShort !== team.nameFull && (
                <p className="text-gray-400 mb-3">{team.nameFull}</p>
              )}
              
              {(team.city || team.stateProv) && (
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{team.city}{team.city && team.stateProv && ', '}{team.stateProv}</span>
                </div>
              )}

              {team.rookieYear && (
                <p className="text-sm text-gray-500">
                  Rookie Year: {team.rookieYear}
                </p>
              )}
            </div>

            {/* Stats */}
            {team.ranking && (
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:min-w-[200px]">
                <div className="cyber-card !p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-cyber-blue" />
                    <span className="text-xs text-gray-400 uppercase">Record</span>
                  </div>
                  <p className="font-mono text-lg">
                    <span className="text-cyber-green">{team.ranking.wins}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-cyber-pink">{team.ranking.losses}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-400">{team.ranking.ties}</span>
                  </p>
                </div>

                {team.ranking.opr && (
                  <div className="cyber-card !p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-cyber-purple" />
                      <span className="text-xs text-gray-400 uppercase">OPR</span>
                    </div>
                    <p className="font-mono text-lg font-bold text-cyber-purple">
                      {team.ranking.opr.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Drawing Canvas - Takes 2 columns */}
        <div className="xl:col-span-2 animate-slide-up animate-delay-100">
          <div className="mb-4">
            <h2 className="text-xl font-display font-bold text-cyber-blue flex items-center gap-2">
              <span className="w-1 h-6 bg-cyber-blue"></span>
              Autonomous Route Planning
            </h2>
            <p className="text-gray-400 text-sm mt-1 ml-3">
              Draw paths and strategies for this team
            </p>
          </div>
          
          <DrawingCanvas
            teamNumber={teamNumber}
            initialDrawing={drawingData}
            onSave={handleDrawingSave}
          />
        </div>

        {/* Notes Sidebar */}
        <div className="animate-slide-up animate-delay-200">
          <div className="mb-4">
            <h2 className="text-xl font-display font-bold text-cyber-blue flex items-center gap-2">
              <span className="w-1 h-6 bg-cyber-blue"></span>
              Scouting Notes
            </h2>
            <p className="text-gray-400 text-sm mt-1 ml-3">
              Record observations and strategies
            </p>
          </div>

          <div className="cyber-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-cyber-blue" />
              <span className="font-semibold">Team Notes</span>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter your scouting notes here...

Examples:
• Strong in autonomous
• Consistent scorer
• Good defense strategy
• Works well in alliances with..."
              className="cyber-input h-96 resize-none cyber-scrollbar font-mono text-sm"
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {notes.length} characters
              </span>
              <button
                onClick={handleSave}
                className={`cyber-button flex items-center gap-2 ${
                  saveStatus === 'saved' ? '!bg-cyber-green' : ''
                }`}
              >
                <Save className="w-4 h-4" />
                {saveStatus === 'saving' ? 'Saving...' :
                 saveStatus === 'saved' ? 'Saved!' :
                 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="cyber-card mt-6">
            <h3 className="font-display font-bold text-cyber-blue mb-3">Match Strategy</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Qualifying Points:</span>
                <span className="font-mono text-cyber-blue">
                  {team.ranking?.qualifyingPoints || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ranking Points:</span>
                <span className="font-mono text-cyber-blue">
                  {team.ranking?.rankingPoints || 'N/A'}
                </span>
              </div>
              {team.ranking?.np !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Navigation Points:</span>
                  <span className="font-mono text-cyber-blue">
                    {team.ranking.np}
                  </span>
                </div>
              )}
              {team.ranking?.tbp !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Tiebreaker Points:</span>
                  <span className="font-mono text-cyber-blue">
                    {team.ranking.tbp}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
