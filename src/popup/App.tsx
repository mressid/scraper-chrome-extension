import { useEffect, useState } from 'react'
import { CiDark } from "react-icons/ci";
import { CiLight } from "react-icons/ci";
import { RiRestartLine } from "react-icons/ri";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(() => {
    return localStorage.getItem('_ExtensionSessionStatus') === 'active'
  })

  const setLocalStorageMessageActivationStatus = (message: 'active' | 'notactive') => {
    localStorage.setItem('_ExtensionSessionStatus', message)
  }

  const sendMessageToContentScript = async (message: { type: string, [key: string]: string }) => {
    if (typeof chrome !== 'undefined' && chrome) {
      const [currentActiveTabId] = (await chrome.tabs.query({active: true, lastFocusedWindow: true}))
      if(!currentActiveTabId.id) {
        return
      }
      chrome.tabs.sendMessage(currentActiveTabId.id, message)
  }else {
    console.error('chrome.runtime.sendMessage is not available')
  }
}

  useEffect(() => {
    if(isSessionActive) {
      sendMessageToContentScript({ type: 'session', status: 'start' })
    } else {
      sendMessageToContentScript({ type: 'session', status: 'stop' })
    }
  }, [isSessionActive]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem('theme')
    if(storedTheme === 'dark') {
      return true
    } else if(storedTheme === 'light') {
      return false
    } else {
      // If no theme is stored, use the system preference
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  });
  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute("data-theme", "dark")
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.setAttribute("data-theme", "light")
      localStorage.setItem('theme', 'light')
    }
    sendThemeChangeMessage();
  }, [isDarkMode])

  const restart = async () => {
      const [currentActiveTabId] = (await chrome.tabs.query({active: true, lastFocusedWindow: true}))
      if(!currentActiveTabId.id) {
        return
      }
      chrome.tabs.sendMessage(currentActiveTabId.id, { type: 'session', status: 'stop' })
    setLocalStorageMessageActivationStatus('notactive')
    setIsSessionActive(false)
  }

  const startSession = async () => {
      const [currentActiveTabId] = (await chrome.tabs.query({active: true, lastFocusedWindow: true}))
      if(!currentActiveTabId.id) {
        return true
      }
      chrome.tabs.sendMessage(currentActiveTabId.id, { type: 'session', status: 'start' }, () => {
        return true
      })
    setLocalStorageMessageActivationStatus('active')
    setIsSessionActive(true)
  }

  const sendThemeChangeMessage = async () => {
    console.log('Sending theme change message to content script:', isDarkMode ? 'dark' : 'light')
    if (typeof chrome !== 'undefined' && chrome) {
      const theme = isDarkMode ? 'dark' : 'light'
      const [currentActiveTabId] = (await chrome.tabs.query({active: true, lastFocusedWindow: true}))
      if(!currentActiveTabId.id) {
        return
      }
      chrome.tabs.sendMessage(currentActiveTabId.id, { type: 'theme', theme })
  }else {
    console.error('chrome.runtime.sendMessage is not available')
  }
}

  if(window) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => {
        if (event.matches) {
          document.body.setAttribute("data-theme", "dark")
        } else {
          document.body.setAttribute("data-theme", "light")
        }
      });
  }

  const setSessionStatus = (active: boolean) => {
    if(active) {
      startSession()
      setIsSessionActive(true)
    } else {
      restart()
      setIsSessionActive(false)
    }
  }

  return (
    <main className="ds-stack ds-stagger">
      <section className="ds-card ds-card-elevated relative">
        <div className="actions absolute right-4 flex gap-2">
          <button onClick={() => { setIsDarkMode((value) => !value)}} className="hover-bg-primary p-1 rounded" type="button">
            {
              isDarkMode ? <CiLight size={20} /> : <CiDark size={20} />
            }
          </button>

          <button onClick={restart} className="bg-surface p-1 rounded" type="button">
            < RiRestartLine color='#888' size={20} />
          </button>
        </div>
        <div className="text my-1">
        <h1 className="ds-title ">Popup Control Center</h1>
        <p className="ds-subtitle">Start your scraping journey.</p>
        </div>
        <div className="ds-row my-2">
          <button onClick={() => setSessionStatus(!isSessionActive)} className="ds-button ds-button-primary" type="button">
            {
              isSessionActive ? 'Stop Scraping' : 'Start Scraping'
            }
          </button>
        </div>
      </section>
    </main>
  )
}
