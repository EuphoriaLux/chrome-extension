# LinkedIn Enhancer

A Chrome extension that enhances your LinkedIn experience with AI-powered features and customizable interactions.

## Key Features

### AI-Powered Comment Generation
- Generate engaging and relevant comments for LinkedIn posts using Google AI
- Intelligent responses based on post content and poster's name
- One-click comment generation and copying

### Customizable Settings
- **AI Configuration**
  - Google AI API key integration
  - Model selection (Gemini Pro/Pro Vision)
  - Adjustable creativity level
  - Maximum comment length control
  
- **Comment Generation**
  - Custom prompt templates with {content} and {name} placeholders
  - Pre-defined prompt styles
  - Word/phrase blacklisting
  - Prompt transparency - see exactly what the AI uses

- **Display Settings**
  - Light/Dark/System theme options
  - Adjustable font sizes
  - Configurable post display limits

## Installation

1. Download the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Configuration

1. Click the extension icon in Chrome and select "Options"
2. Enter your Google AI API key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))
3. Customize other settings as desired:
   - Default prompt template
   - AI model and parameters
   - Theme and display preferences
   - Blacklisted words/phrases

## Usage

1. Navigate to LinkedIn
2. Click the LinkedIn Enhancer icon in your browser
3. View LinkedIn posts in the popup window
4. Click "Generate Comment" on any post
5. Review and copy the generated comment
6. Paste into LinkedIn's comment box

## Technical Details

### Technologies
- JavaScript (ES6+)
- Chrome Extension APIs
- Google AI Generative Language API
- HTML5/CSS3

### Architecture
- Background service worker for extension management
- Content scripts for LinkedIn page interaction
- Popup interface for user interactions
- Options page for configuration
- API service for AI integration

### Security
- API key validation and secure storage
- Content sanitization
- Error handling and user feedback

## Requirements

- Google Chrome browser (version 88 or higher)
- Google AI API key
- Active internet connection

## Privacy

This extension:
- Only accesses LinkedIn.com
- Stores settings locally in Chrome
- Sends post content to Google AI only when generating comments
- Does not collect or store user data

## Support

For issues, questions, or feature requests:
1. Check the [Issues](link-to-issues) section
2. Create a new issue with detailed information
3. Follow the issue template guidelines

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE)

## Authors

Your Name

## Acknowledgments

- Google AI team for the Generative Language API
- Chrome Extensions documentation and community
- LinkedIn platform for inspiration

---

**Note:** This extension is not affiliated with or endorsed by LinkedIn Corporation.
