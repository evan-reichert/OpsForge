// Import dependencies
import logo from '../assets/logo.png';
import './Tabs.css';

type TabsProps = {
    activeTab: string;
    onTabChange: (tab: string) => void;
};

// Define the Tabs component, containing the navigation bar with three tabs: Upload, Past Reports, and About
function Tabs({ activeTab, onTabChange }: TabsProps) {
    
    // Render the navigation bar with tabs
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom animate-on-load" style={{ ['--order' as any]: 0 }}>
            <div className="container-fluid">
                <div className="d-flex align-items-center gap-2">
                    <img src={logo} alt="OpsForge Logo" style={{ height: '40px', width: '40px' }} />
                    <span className="navbar-brand mb-0 h1" style={{ margin: 0 }}>OpsForge</span>
                </div>
                <div className="nav nav-tabs" role="tablist">
                    <button 
                        className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => onTabChange('upload')}
                    >
                        Upload
                    </button>
                    <button 
                        className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => onTabChange('reports')}
                    >
                        Past Reports
                    </button>
                    <button 
                        className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
                        onClick={() => onTabChange('about')}
                    >
                        About
                    </button>
                </div>
            </div>
        </nav>
    )
}

// Export the Tabs component for use in other parts of the application
export default Tabs