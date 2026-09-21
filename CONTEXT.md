# Catch Game

A game about catching falling food, with visible progression during a run.

## Language

**Food**:
A beneficial falling item intended to be caught.

**Stage**:
A distinct segment of a run with its own visual atmosphere and difficulty, increasing as the player progresses.
_Avoid_: Level as a separate progression concept; use Stage consistently.

## Relationships

- A run can contain multiple **Stages**.
- Progression between **Stages** is measured by food items caught during that run.
- A **Stage** contains falling **Food**.

## Example dialogue

> **Developer:** "How does the player recognize a new **Stage**?"
> **Designer:** "Its atmosphere changes, for example through lighting, and catching food becomes harder."

## Flagged ambiguities

- Earlier documents separated visual stages from difficulty levels — resolved: a **Stage** combines both in one progression system.
