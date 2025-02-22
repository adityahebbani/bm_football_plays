import React from 'react';

const About: React.FC = () => {
    return (
        <div className="about-container">
            <h1>About BoilerMake Football Plays</h1>
            <p>
                BoilerMake Football Plays is an innovative web application designed to leverage computer vision technology to predict the plays of American football teams based on their offensive formations. 
            </p>
            <p>
                The application allows users to upload photos or videos of football formations, which are then analyzed in real-time by a trained machine learning model. The model scans the uploaded media and provides probabilities for various potential plays, helping coaches, analysts, and fans gain insights into the game.
            </p>
            <p>
                Our goal is to enhance the understanding of football strategies and improve decision-making through advanced technology. Whether you're a coach looking to refine your team's tactics or a fan wanting to deepen your knowledge of the game, BoilerMake Football Plays is here to assist you.
            </p>
            <p>
                We are continuously working to improve the accuracy of our predictions and expand the capabilities of our application. Thank you for your interest in BoilerMake Football Plays!
            </p>
        </div>
    );
};

export default About;