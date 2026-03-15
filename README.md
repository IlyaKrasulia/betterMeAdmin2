# BetterMe Admin App

Admin panel for building and managing personalization quiz flows.

## DAG Architecture

The quiz flow is modeled as a **Directed Acyclic Graph (DAG)** — a set of nodes connected by directed edges, with no cycles allowed. The user progresses through the graph from an **entry node** to a terminal **offer node**, following edges that are evaluated based on their answers.

### Node Types

| Type | Purpose | Data collected |
|------|---------|----------------|
| **Question** | Collects user input. Supports three answer types: **Single Choice** (radio buttons), **Multiple Choice** (checkboxes), and **Slider** (numeric range with min/max bounds). Each question is bound to an `attributeKey` (e.g. `goal`, `age`, `fitness_level`) that stores the user's answer for later routing decisions. | Yes — saves answer value under its `attributeKey` |
| **Info Page** | Displays a motivational or informational screen (title, body text, optional image). Does not collect any data — the user simply proceeds to the next node. | No |
| **Offer** | Terminal node that presents a personalized offer to the user. Contains a headline, description, CTA button text, price, and optional physical wellness kit details (kit name, kit contents). An offer node is linked to an `Offer` entity in the backend. | No (triggers conversion) |

### Edges and Routing

Edges connect a **source node** to a **target node** and control which path the user takes through the graph. Each edge has two key properties:

#### Priority
An integer (0 = lowest). When multiple edges leave the same source node, they are **evaluated in descending priority order** — the first edge whose conditions match wins. This means higher-priority edges are checked first.

#### Conditions
Each edge is either **unconditional** or **conditional**:

- **Unconditional (always)**: The edge always matches. Typically used as the **fallback/default** path with priority 0, so it fires only when no conditional edge above it matched.

- **Conditional**: The edge carries one or more **condition rules** combined with AND logic. All rules must match for the edge to fire. Each rule evaluates a user attribute collected by a previous Question node.

#### Condition Rules

A single rule has the shape:

```
{ attributeKey, operator, value, valueTo? }
```

| Field | Description |
|-------|-------------|
| `attributeKey` | The user attribute to check (must match a Question node's attribute, e.g. `goal`, `age`) |
| `operator` | Comparison operator (see table below) |
| `value` | The value to compare against (or range start for `between`, comma-separated list for `in`/`not_in`) |
| `valueTo` | Range end — only used with `between` operator |

**Supported operators:**

| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` | Equals | `age eq 25` |
| `neq` | Not equals | `goal neq weight_loss` |
| `gt` | Greater than | `stress_level gt 7` |
| `gte` | Greater than or equal | `age gte 18` |
| `lt` | Less than | `energy_level lt 3` |
| `lte` | Less than or equal | `available_time lte 30` |
| `between` | Between (inclusive) | `age between 25–35` |
| `in` | Is one of (comma-separated) | `goal in weight_loss,muscle_gain` |
| `not_in` | Is not one of | `injuries not_in back,knee` |
| `contains` | Contains substring | `location contains New` |

#### Routing Example

```
[Question: What is your goal?]
    │
    ├── (goal eq weight_loss) priority=2 ──► [Info: Weight Loss Program]
    ├── (goal eq muscle_gain) priority=1 ──► [Info: Muscle Building Program]
    └── (always) priority=0 ──────────────► [Info: General Wellness Program]
```

The engine evaluates edges from priority 2 down. If the user answered `weight_loss`, the first edge matches and they go to the Weight Loss info page. If they answered `muscle_gain`, the second edge matches. For any other answer, the unconditional fallback fires.

### Edge Serialization

On the backend, edge conditions are stored as a JSON string (`conditionsJson`):
- `null` — unconditional edge (always matches)
- JSON array of `{ AttributeKey, Operator, Value, ValueTo? }` objects — conditional edge with AND logic

### Save Flow

When the admin clicks **Save** in the editor, the frontend diffs the current canvas state against the last-loaded API data and issues only the necessary API calls:

1. **Create** new nodes (POST) and their options
2. **Update** modified nodes (PUT) — content and inline offer data
3. **Update** node positions (PUT)
4. **Sync** question options (create/update/delete)
5. **Delete** removed nodes
6. **Create** new edges
7. **Update** edges with changed conditions or priority
8. **Delete** removed edges
9. **Reload** the full flow from the API to get server-assigned IDs

### Available Attributes

These are the user attributes that Question nodes can collect and edge conditions can evaluate:

| Key | Type | Description |
|-----|------|-------------|
| `age` | Numeric | User's age |
| `gender` | Enum | User's gender |
| `goal` | Enum | Primary wellness goal |
| `location` | Text | User's location |
| `fitness_level` | Enum | Current fitness level |
| `available_time` | Numeric | Minutes available per day |
| `injuries` | Enum | Any physical limitations |
| `motivation` | Enum | What motivates the user |
| `stress_level` | Numeric | Stress level (scale) |
| `sleep_level` | Numeric | Sleep quality (scale) |
| `energy_level` | Numeric | Energy level (scale) |
