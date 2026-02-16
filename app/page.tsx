'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Trophy, TrendingUp, Users, RefreshCw } from 'lucide-react';
import AdminSettings from '@/components/AdminSettings';
import { fetchTeamsWithRankings, TeamWithRanking } from '@/lib/ftc-api';

export default function HomePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamWithRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTeamsWithRankings();
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    
    const query = searchQuery.toLowerCase();
    return teams.filter(team => 
      team.teamNumber.toString().includes(query) ||
      team.nameShort?.toLowerCase().includes(query) ||
      team.nameFull?.toLowerCase().includes(query)
    );
  }, [teams, searchQuery]);

  const stats = useMemo(() => {
    const ranked = teams.filter(t => t.ranking).length;
    const avgOPR = teams.reduce((sum, t) => sum + (t.ranking?.opr || 0), 0) / ranked || 0;
    const topTeam = teams.sort((a, b) => (a.ranking?.rank || 999) - (b.ranking?.rank || 999))[0];
    
    return {
      totalTeams: teams.length,
      rankedTeams: ranked,
      avgOPR: avgOPR.toFixed(2),
      topTeam: topTeam?.teamNumber || 'N/A',
    };
  }, [teams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AdminSettings />
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-blue mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AdminSettings />
        <div className="cyber-card max-w-md w-full text-center">
          <div className="text-red-400 text-5xl mb-4">⚠</div>
          <h2 className="text-xl font-display text-red-400 mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={loadTeams} className="cyber-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <AdminSettings />
      
      {/* Header */}
      <header className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-12 bg-cyber-blue glow-text"></div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-cyber-blue glow-text">
            FTC DECODE
          </h1>
        </div>
        <p className="text-gray-400 ml-5 font-mono text-sm">
          Alberta Championship 2026 • Event Code: CAABCMP
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="cyber-card animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono mb-1">Total Teams</p>
              <p className="text-3xl font-display font-bold text-cyber-blue">{stats.totalTeams}</p>
            </div>
            <Users className="w-10 h-10 text-cyber-blue opacity-50" />
          </div>
        </div>

        <div className="cyber-card animate-slide-up animate-delay-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono mb-1">Ranked</p>
              <p className="text-3xl font-display font-bold text-cyber-green">{stats.rankedTeams}</p>
            </div>
            <Trophy className="w-10 h-10 text-cyber-green opacity-50" />
          </div>
        </div>

        <div className="cyber-card animate-slide-up animate-delay-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono mb-1">Avg OPR</p>
              <p className="text-3xl font-display font-bold text-cyber-purple">{stats.avgOPR}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-cyber-purple opacity-50" />
          </div>
        </div>

        <div className="cyber-card animate-slide-up animate-delay-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-mono mb-1">Top Team</p>
              <p className="text-3xl font-display font-bold text-cyber-pink">#{stats.topTeam}</p>
            </div>
            <Trophy className="w-10 h-10 text-cyber-pink opacity-50" />
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="cyber-card mb-6 animate-slide-up animate-delay-400">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team number or name..."
              className="cyber-input pl-10"
            />
          </div>
          <button 
            onClick={loadTeams}
            className="cyber-button-secondary flex items-center gap-2 justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Teams Table */}
      <div className="cyber-card animate-slide-up animate-delay-400 overflow-hidden">
        <div className="overflow-x-auto cyber-scrollbar">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team #</th>
                <th>Team Name</th>
                <th className="hidden md:table-cell">Location</th>
                <th>W-L-T</th>
                <th>OPR</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No teams found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team, index) => (
                  <tr 
                    key={team.teamNumber}
                    onClick={() => router.push(`/team/${team.teamNumber}`)}
                    style={{ animationDelay: `${index * 20}ms` }}
                    className="animate-fade-in"
                  >
                    <td>
                      {team.ranking ? (
                        <span className={`font-display font-bold ${
                          team.ranking.rank === 1 ? 'text-cyber-yellow glow-text' :
                          team.ranking.rank <= 3 ? 'text-cyber-blue' :
                          team.ranking.rank <= 8 ? 'text-cyber-green' :
                          'text-gray-400'
                        }`}>
                          #{team.ranking.rank}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono font-bold text-cyber-blue">
                        {team.teamNumber}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div className="font-semibold">{team.nameShort || team.nameFull}</div>
                        {team.nameShort && team.nameFull && team.nameShort !== team.nameFull && (
                          <div className="text-xs text-gray-500">{team.nameFull}</div>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell text-gray-400 text-sm">
                      {team.city && team.stateProv ? `${team.city}, ${team.stateProv}` : 
                       team.city || team.stateProv || '—'}
                    </td>
                    <td>
                      {team.ranking ? (
                        <span className="font-mono text-sm">
                          <span className="text-cyber-green">{team.ranking.wins}</span>
                          <span className="text-gray-500">-</span>
                          <span className="text-cyber-pink">{team.ranking.losses}</span>
                          <span className="text-gray-500">-</span>
                          <span className="text-gray-400">{team.ranking.ties}</span>
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td>
                      {team.ranking?.opr ? (
                        <span className="font-mono font-bold text-cyber-purple">
                          {team.ranking.opr.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
