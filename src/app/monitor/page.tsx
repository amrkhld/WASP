'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface SocketMetric {
  socketId: string;
  metrics: {
    latency: number[];
    messagesSent: number;
    messagesReceived: number;
    errors: { timestamp: number; error: string }[];
    connectionDuration: number;
    reconnections: number;
    lastPing?: number;
  };
  averageLatency: number;
}

interface LogEntry {
  event: string;
  socketId: string;
  timestamp: string;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

interface MonitorData {
  status: string;
  timestamp: string;
  activeConnections: number;
  metrics: SocketMetric[];
}

export default function MonitorPage() {
  const { data: session } = useSession();
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSocketId, setSelectedSocketId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [logLimit, setLogLimit] = useState(100);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsResponse, logsResponse] = await Promise.all([
          fetch('/api/socket/monitor'),
          fetch(`/api/socket/logs?limit=${logLimit}${selectedSocketId ? `&socketId=${selectedSocketId}` : ''}${selectedEvent ? `&event=${selectedEvent}` : ''}`)
        ]);

        const metricsData = await metricsResponse.json();
        const logsData = await logsResponse.json();

        setMonitorData(metricsData);
        setLogs(logsData.logs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [selectedSocketId, selectedEvent, logLimit]);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Access denied. Please log in.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!monitorData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Socket.IO Monitor</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className={`text-xl ${monitorData.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {monitorData.status}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Connections</h3>
            <p className="text-xl">{monitorData.activeConnections}</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Last Update</h3>
            <p className="text-xl">{new Date(monitorData.timestamp).toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Socket Connections</h2>
        <div className="space-y-4">
          {monitorData.metrics.map((socket) => (
            <div key={socket.socketId} className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Socket: {socket.socketId}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Messages</h3>
                  <p>Sent: {socket.metrics.messagesSent}</p>
                  <p>Received: {socket.metrics.messagesReceived}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Connection</h3>
                  <p>Duration: {Math.floor(socket.metrics.connectionDuration / 1000)}s</p>
                  <p>Reconnections: {socket.metrics.reconnections}</p>
                  <p>Avg Latency: {socket.averageLatency.toFixed(2)}ms</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Activity</h3>
                  <p>
                    {socket.metrics.lastPing
                      ? new Date(socket.metrics.lastPing).toLocaleTimeString()
                      : 'No activity'}
                  </p>
                </div>
              </div>
              {socket.metrics.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Recent Errors</h3>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {socket.metrics.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600">
                        [{new Date(error.timestamp).toLocaleTimeString()}] {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Socket Logs</h2>
        <div className="mb-4 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Socket ID</label>
            <select
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={selectedSocketId}
              onChange={(e) => setSelectedSocketId(e.target.value)}
            >
              <option value="">All Sockets</option>
              {monitorData?.metrics.map((socket) => (
                <option key={socket.socketId} value={socket.socketId}>
                  {socket.socketId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">All Events</option>
              {Array.from(new Set(logs.map(log => log.event))).map(event => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
            <select
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={logLimit}
              onChange={(e) => setLogLimit(Number(e.target.value))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log, index) => (
                  <tr key={index} className={log.error ? 'bg-red-50' : undefined}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {log.socketId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.event}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.error ? (
                        <span className="text-red-600">{log.error}</span>
                      ) : (
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(log.data || log.metadata, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}