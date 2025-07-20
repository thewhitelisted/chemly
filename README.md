# Chemly - Modern Chemical Drawing Tool

A modern, AI-powered chemical drawing tool built with React and TypeScript. Designed to replace legacy software like ChemDraw with a fast, intuitive, and smart web interface.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to start drawing molecules!

## Features

- **Custom Drawing Engine**: Built from scratch using React + SVG
- **Interactive Canvas**: Click to place atoms, drag to create bonds  
- **Modern UI**: Clean, Figma-like interface
- **Element Support**: C, O, N, P, S, halogens, H
- **Bond Types**: Single, double, triple bonds
- **SMILES Export**: Copy structures as SMILES strings

## How to Use

1. **Select Tool**: Click the select tool (pointer icon) to move existing atoms
2. **Add Atoms**: Select an element from the toolbar, then click on canvas to place atoms
3. **Create Bonds**: Select bond tool and drag between atoms to create bonds
4. **Move Atoms**: Use the select tool to click and drag atoms to new positions
5. **Erase**: Use eraser to remove atoms/bonds by clicking on them
6. **Export**: Copy structure as SMILES from right sidebar

Built with React + TypeScript + Tailwind CSS
