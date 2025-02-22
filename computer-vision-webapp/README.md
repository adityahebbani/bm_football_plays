# BoilerMake Football Plays

## Overview
BoilerMake Football Plays is a web application designed to predict the plays of American football teams based on their offensive formations. By utilizing advanced computer vision techniques, the application analyzes uploaded images or videos and provides real-time predictions of the likely plays.

## Features
- Upload images or videos of football formations.
- Real-time analysis and prediction of plays.
- User-friendly interface with a clean design.
- About section explaining the project and its functionality.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/computer-vision-webapp.git
   ```
2. Navigate to the project directory:
   ```
   cd computer-vision-webapp
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm start
```
This will launch the application in your default web browser at `http://localhost:3000`.

### Deployment
To deploy the application on AWS EC2:
1. Set up an EC2 instance with a suitable configuration.
2. Install Node.js and npm on the instance.
3. Transfer your project files to the EC2 instance.
4. Run `npm install` to install dependencies.
5. Start the application using `npm start`.
6. Configure your security group to allow traffic on the port your application is running (default is 3000).

## Integration with Vision Model
The application integrates with a computer vision model to analyze uploaded media. The logic for this integration is handled in the `src/visionModelIntegration.ts` file. Ensure that your model is accessible from the server where the application is hosted.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.