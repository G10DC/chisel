# Context Memory Suite Architecture

The G10DC Agentic Memory Subsystem consists of three complementary, non-overlapping components:

1. **`chisel` (In-Flight Context Compression)**:
   Prunes stale turns, duplicate tool calls, and compresses conversational history mid-turn without touching disk state.

2. **`chronicle-session-memory` (Session State Checkpoints)**:
   Creates cryptographically secure, structured semantic checkpoints on disk for long-running trajectory persistence.

3. **`portage` (Context Loading & Reboot Recovery)**:
   Handles sandbox environment reboots, loading exact context snapshots back into active memory upon container or session restarts.

## Architectural Flow
```
[ User Interaction ] ---> [ chisel: In-flight Compression ]
                                  │
                                  ▼
                    [ chronicle: Checkpoint Persistence ]
                                  │
                                  ▼
                    [ portage: Reboot Memory Restoration ]
```
