import { useState } from 'react'
import './App.css'
import TabNav from './TabNav';
import { SelectRootElement } from './steps/SelectRootElement';
import { SelectChildren } from './steps/SelectChildren';
import { SelectPagination } from './steps/SelectPagination';
import { PreviewExecution } from './steps/PreviewExecution';
import Logo from '../../assets/crx.svg';
import { useUIStore } from './store';
import useTheme from './store/ThemeStore';

function App() {
  const [show, setShow] = useState(false)
  const [showIcon, setShowIcon] = useState(() => {
    return localStorage.getItem('ExtensionSessionStatus') === 'active' ? true : false
  })
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message in popup:', message, sender)
    if(message.type === 'theme') {
      if(message.theme === 'dark') {
        document.body.setAttribute("ext-data-theme", "dark")
      } else {
        document.body.setAttribute("ext-data-theme", "light")
      }
      useTheme.setState({ theme: message.theme })
    }
    if (message.type === 'session') {
      setShowIcon(message.status === 'start' ? true : false)
      if(message.status !== 'start') {
        setShow(false)
      }
      localStorage.setItem('ExtensionSessionStatus', message.action === 'start' ? 'active' : 'inactive')
    }
    sendResponse({ ok: true })  
  })
  const toggle = () => setShow(!show)
  return (
    <div className="crx-ext-popup-container crx-ext-root-ext">
      {show && (
        <div className="crx-ext-popup-card crx-ext-popup-content" style={{
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="crx-ext-tab-content">
            {activeTab === 'root' && (
              <div className="crx-ext-tab-pane crx-ext-fade-in">
                <SelectRootElement />
              </div>
            )}
            {activeTab === 'children' && (
              <div className="crx-ext-tab-pane crx-ext-fade-in">
                <SelectChildren />
              </div>
            )}
            {activeTab === 'pagination' && (
              <div className="crx-ext-tab-pane crx-ext-fade-in">
                <SelectPagination />
              </div>
            )}
            {activeTab === 'preview' && (
              <div className="crx-ext-tab-pane crx-ext-fade-in">
                <PreviewExecution />
              </div>
            )}
          </div>
    </div>
  )}
  {
    showIcon && (
      <button className="crx-ext-toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="crx-ext-button-icon" />
      </button>
    )
  }
  </div>
  )
}

export default App
