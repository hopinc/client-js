import {createRoot} from 'react-dom/client';
import {Main} from './app';

function App() {
	return <Main />;
}

createRoot(document.getElementById('root')!).render(<App />);
