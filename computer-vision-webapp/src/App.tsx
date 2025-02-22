import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Library from './components/Library';
import './assets/styles.css';

const App: React.FC = () => {
    return (
        <Router>
            <header>
                <h1>BoilerMake Football Plays</h1>
                <nav>
                    <Link to="/">
                        <button className="nav-button">Home</button>
                    </Link>
                    <Link to="/about">
                        <button className="nav-button">About</button>
                    </Link>
                    <Link to="/library">
                        <button className="nav-button">Library</button>
                    </Link>
                </nav>
            </header>
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/about" component={About} />
                <Route path="/library" component={Library} />
            </Switch>
        </Router>
    );
};

export default App;