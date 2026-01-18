# Culinary Lens - AI-Powered Food Analysis

An intelligent web application that leverages AI and computer vision to analyze food images, providing comprehensive nutritional insights, cuisine classification, and freshness assessment.

## Features

- 🍽️ **Cuisine Classification** - Identifies cuisine types from food images
- 📊 **Nutritional Analysis** - Provides detailed nutritional information
- ✨ **Freshness Detection** - Assesses ingredient freshness and quality
- 🔍 **Object Detection** - Identifies individual food items in images
- 🧠 **AI-Powered Insights** - Uses Google Gemini AI for enhanced analysis
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **AI Integration**: Google Gemini API
- **Styling**: CSS

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/harshnandal981/culinarylens.git
cd culinarylens

# Install dependencies
npm install

# Set up environment variables
# Create a .env.local file with your Google Gemini API key
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env.local
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
├── services/           # API and business logic services
├── perception/         # Computer vision modules
├── fusion/            # Data fusion and merging
├── docs/              # Documentation
└── types.ts           # TypeScript type definitions
```

## Deployment

This project uses GitHub Actions for continuous deployment to GitHub Pages. Every push to the `main` branch automatically:
1. Builds the application
2. Deploys to GitHub Pages

Live demo: [https://harshnandal981.github.io/culinarylens](https://harshnandal981.github.io/culinarylens)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal and commercial purposes.

## Author

[Harsh Nandal](https://github.com/harshnandal981)
