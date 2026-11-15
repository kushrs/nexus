import { useState, useEffect } from 'react';
import {
  Network,
  Server,
  Zap,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import { usersAPI, authAPI, paymentsAPI, notificationsAPI, mlAPI } from '../services/api';

const microservices = [
  {
    id: 'gateway',
    name: 'API Gateway',
    port: '8080',
    type: 'Edge Router',
    status: 'HEALTHY',
    tech: 'Spring Cloud Gateway / Netty',
    desc: 'JWT validation, token bucket rate limiting, smart load balancing, Kafka log publisher',
  },
  {
    id: 'auth',
    name: 'Auth Service',
    port: '8081',
    type: 'Identity',
    status: 'HEALTHY',
    tech: 'Spring Boot 3 / JJWT',
    desc: 'UUID identity store, credential verification, HMAC-SHA256 token issuance',
  },
  {
    id: 'user-1',
    name: 'User Service (Instance 1)',
    port: '8082',
    type: 'Service Worker',
    status: 'HEALTHY',
    tech: 'Spring Boot 3 / JPA',
    weight: '50%',
    desc: 'Primary accounts registry instance with smart routing health scoring',
  },
  {
    id: 'user-2',
    name: 'User Service (Instance 2)',
    port: '8092',
    type: 'Service Worker',
    status: 'HEALTHY',
    tech: 'Spring Boot 3 / JPA',
    weight: '50%',
    desc: 'Failover replica with independent CPU and latency tracking',
  },
  {
    id: 'pay-1',
    name: 'Payment Service (Instance 1)',
    port: '8083',
    type: 'Service Worker',
    status: 'HEALTHY',
    tech: 'Spring Boot 3 / JPA',
    weight: '50%',
    desc: 'Transaction processing node 1',
  },
  {
    id: 'pay-2',
    name: 'Payment Service (Instance 2)',
    port: '8093',
    type: 'Service Worker',
    status: 'HEALTHY',
    tech: 'Spring Boot 3 / JPA',
    weight: '50%',
    desc: 'Transaction processing node 2',
  },
  {
    id: 'notif-1',
    name: 'Notification Service (Instance 1)',
    port: '8084',
    type: 'Service Worker',
    status: 'HEALTHY',
    tech: 'Spring Boot 3 / JPA',
    weight: '50%',
    desc: 'Alert dispatch instance 1',
  },
  {
    id: 'notif-2',
    name: 'Notification Service (Instance 2)',
    port: '8094',
    type: 'Service Worker',
    status: 'HEALTHY',
    tech: 'Spring Boot 3 / JPA',
    weight: '50%',
    desc: 'Alert dispatch instance 2',
  },
  {
    id: 'log-consumer',
    name: 'Log Consumer & Analytics',
    port: '8085',
    type: 'Analytics',
    status: 'HEALTHY',
    tech: 'Spring Kafka / Redis',
    desc: 'Consumes api-log-events, aggregates rolling RPM, feeds Python ML predictor',
  },
  {
    id: 'ml',
    name: 'Python ML Engine',
    port: '8000',
    type: 'AI Inference',
    status: 'HEALTHY',
    tech: 'FastAPI / Scikit-Learn',
    desc: 'RandomForestRegressor overload probability + IsolationForest anomaly detection',
  },
];

const infraNodes = [
  { name: 'Redis Cache', port: '6379', role: 'Token Bucket & Policy Cache', tech: 'Redis 7 Alpine' },
  { name: 'Apache Kafka', port: '9092', role: 'Asynchronous Event Pipeline', tech: 'Confluent CP 7.5' },
  { name: 'PostgreSQL DB', port: '5432', role: 'UUID Relational Storage', tech: 'PostgreSQL 15 Alpine' },
  { name: 'Prometheus', port: '9090', role: 'Metrics Scraping Engine', tech: 'Prometheus v2.45' },
];

export default function Topology() {
  const [pingStatus, setPingStatus] = useState({});
  const [testingNode, setTestingNode] = useState(null);

  const testPing = async (id, testFn) => {
    setTestingNode(id);
    const start = performance.now();
    try {
      await testFn();
      const duration = Math.round(performance.now() - start);
      setPingStatus((prev) => ({ ...prev, [id]: { ok: true, latency: `${duration}ms` } }));
    } catch {
      const duration = Math.round(performance.now() - start);
      setPingStatus((prev) => ({ ...prev, [id]: { ok: false, latency: `${duration}ms` } }));
    } finally {
      setTestingNode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-primary-400" />
            Cluster Mesh & Smart Routing Matrix
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time topology of active microservices, high-availability paired replicas, and infrastructure backbones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              testPing('user-1', () => usersAPI.getAll());
              testPing('pay-1', () => paymentsAPI.getAll());
              testPing('notif-1', () => notificationsAPI.getAll());
              testPing('ml', () => mlAPI.getPredictions());
            }}
            className="btn-secondary text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary-400" />
            <span>Health Ping All Nodes</span>
          </button>
        </div>
      </div>

      {/* Smart Routing Formula Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary-950/60 via-surface-900 to-indigo-950/40 border border-primary-500/20 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 font-semibold border border-primary-500/30">
              SMART ROUTING LOAD BALANCER
            </span>
            <h3 className="text-sm font-semibold text-white">Dynamic Health Score Algorithm</h3>
            <p className="text-xs text-slate-400 max-w-2xl font-mono">
              Health Score = (0.5 × Latency Score) + (0.3 × CPU Score) + (0.2 × Error Rate Score)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-2 rounded-lg bg-surface-950/80 border border-white/[0.08]">
              <span className="text-slate-400 block text-[10px]">ROUTE BALANCER</span>
              <span className="text-emerald-400 font-bold">ACTIVE (HEALTH-WEIGHTED)</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-surface-950/80 border border-white/[0.08]">
              <span className="text-slate-400 block text-[10px]">CIRCUIT BREAKER</span>
              <span className="text-sky-400 font-bold">RESILIENCE4J ARMED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Microservices Grid */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 font-mono">
          PROVISIONED MICROSERVICES (10 NODES)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {microservices.map((svc) => {
            const ping = pingStatus[svc.id];
            const isPinging = testingNode === svc.id;

            return (
              <div
                key={svc.id}
                className="control-card p-4 hover:border-primary-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                        <Server className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{svc.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">Port :{svc.port}</span>
                      </div>
                    </div>
                    <span className="badge badge-success text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {svc.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 mb-3 leading-relaxed">{svc.desc}</p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{svc.tech}</span>
                  {ping ? (
                    <span className={`text-[10px] font-semibold ${ping.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ping.latency} {ping.ok ? 'OK' : 'ERR'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Infrastructure Backbones */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 font-mono">
          INFRASTRUCTURE BACKBONES
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {infraNodes.map((infra) => (
            <div key={infra.name} className="control-card p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <Database className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-semibold text-white">{infra.name}</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 font-mono">Port :{infra.port}</p>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <span>{infra.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

