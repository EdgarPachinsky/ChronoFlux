# ⏱️ ChronoFlux - Interactive Physics Particle Simulator

ChronoFlux is an advanced, interactive particle simulator built in Angular + Canvas. Designed for visualizing and experimenting with real-world physics principles, it allows users to manipulate forces, observe motion in real time, and tweak simulation parameters through a beautiful and intuitive UI.

## 🧠 Core Concept

At its heart, ChronoFlux is a playground for forces. It simulates particle motion under the influence of:

- Gravity
- Wind
- Air Resistance (Drag)
- Surface Elasticity (Bounciness)

The simulator is highly interactive, ideal for both educational use and physics experimentation.

---

## 🚀 Features

### 🎯 Particle Dynamics
- **Real-time particle motion** under force influence
- **Mass unit toggle** (grams ↔ kilograms)
- **Velocity vectors**, **acceleration arrows**, and **net force visualization**
- **Elastic collisions** with boundary walls

### 🛠 Force Customization
- **Gravity**: Customize direction, magnitude, and color
- **Wind**: Apply lateral force to all particles
- **Air Resistance**: Simulated using quadratic drag (F ∝ v²)
- **Surface Elasticity**: Controls how much energy is retained after collision
- **Friction**: Applied only when particle is at rest on a surface (optional)

### 📊 Simulation Controls
- **Delta Time slider**: Change simulation time step (affects resolution/speed)
- **Play / Pause** and **Step-by-step iteration**
- **Visual timeline** of simulation frames (planned)

### ⚙️ Technical Stack
- **Angular** (Reactive Forms for all controls)
- **Canvas 2D** (rendering engine)

---

## 📦 Installation

```bash
git clone https://github.com/your-username/chronoflux.git
cd chronoflux
npm install
npm start
