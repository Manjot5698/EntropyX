# EntropyX - PRD

## Original Problem Statement
Build a full-stack production-style web platform called "EntropyX — Blockchain Validator Fairness & Entropy Analytics Platform" that provides secure and highly unpredictable blockchain validator selection using real-world entropy sources while proving long-term fairness and decentralization through persistent analytics.

## Architecture
- **Frontend**: React + Tailwind CSS + Phosphor Icons + Recharts
- **Backend**: FastAPI with async MongoDB (Motor)
- **Database**: MongoDB
- **Auth**: Google OAuth via Emergent Auth (optional, demo mode available)

## Core Requirements
1. Secure validator selection using entropy (camera noise, network jitter, timestamps, system pool)
2. Persistent database storage for validators, selections, fairness analytics
3. Multi-user simulation support with sessions
4. Real-time entropy engine visualization
5. Fairness analytics with charts and reports
6. 1000-round simulation with cinematic streaming updates

## User Personas
1. **Blockchain Developers**: Testing validator selection algorithms
2. **Security Auditors**: Verifying fairness and entropy quality
3. **Hackathon Judges**: Evaluating decentralization metrics

## What's Been Implemented (April 2026)
### Backend
- [x] Entropy Engine with 5 sources (camera, network, timestamp, system, feedback)
- [x] SHA-256 hashing for secure random generation
- [x] Validator CRUD endpoints (add, remove, update, list)
- [x] Selection endpoint with weighted randomization
- [x] Batch simulation endpoint (up to 1000 rounds)
- [x] Fairness report with decentralization scoring
- [x] Entropy status endpoint
- [x] Session management
- [x] Google OAuth via Emergent Auth

### Frontend
- [x] Landing page with cyberpunk aesthetic
- [x] Dashboard with 4-panel grid layout
- [x] Current Selection panel with entropy confidence
- [x] Entropy Engine status visualization
- [x] Fairness Metrics panel
- [x] Validator Network cards with management
- [x] Selection Frequency bar chart
- [x] Distribution pie chart
- [x] Entropy Confidence line chart
- [x] Selection History table
- [x] 1000-round simulation with progress overlay
- [x] Add Validator dialog
- [x] Demo mode (works without authentication)

## Prioritized Backlog
### P0 (Critical) - DONE
- Core entropy engine ✓
- Validator selection ✓
- Fairness analytics ✓
- Dashboard UI ✓

### P1 (High)
- Export fairness reports to PDF/CSV
- Real-time WebSocket updates
- Historical trend analysis over time

### P2 (Medium)
- Multi-session comparison view
- Entropy source weighting configuration
- Custom simulation parameters

### P3 (Low)
- API rate limiting
- Advanced access controls
- Audit logging

## Next Tasks
1. Add export functionality for fairness reports
2. Implement WebSocket for real-time entropy updates
3. Add historical trend analysis
4. Enhance mobile responsiveness
