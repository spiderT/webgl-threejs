import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App.jsx';

import { ipcRenderer } from 'electron';


ReactDOM.render(<App />, document.getElementById('appRoot'));