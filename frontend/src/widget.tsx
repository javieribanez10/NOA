// frontend/src/widget.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import Embedded from './pages/Embedded'

declare global {
  interface Window {
    NOA?: {
      config?: {
        apiKey?: string
        theme?: string
        position?: string
        type?: string
        bubbleConfig?: {
          initialMessage: string
          title: string
          subtitle: string
          primaryColor: string
          secondaryColor: string
          textColor: string
          fontSize: string
          fontFamily: string
        }
      }
    }
  }
}

// Función para crear un contenedor en el DOM si no existe
const mountWidgetContainer = (): HTMLElement => {
  const containerId = 'noa-widget-container'
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    // Ajusta la posición y estilos básicos aquí (por ejemplo, posición fija en la esquina)
    container.style.position = 'fixed'
    container.style.bottom = '20px'
    container.style.right = '20px'
    document.body.appendChild(container)
  }
  return container
}

// Función para crear el punto de montaje, usando Shadow DOM si está disponible
const createMountPoint = (container: HTMLElement): HTMLElement => {
  if (container.attachShadow) {
    // Crea un Shadow Root para aislar estilos
    const shadow = container.attachShadow({ mode: 'open' })
    const mountPoint = document.createElement('div')
    shadow.appendChild(mountPoint)
    return mountPoint
  }
  return container
}

// Leer la configuración definida en window.NOA.config
const config = window.NOA && window.NOA.config ? window.NOA.config : {}

// Montar el widget en el contenedor
const container = mountWidgetContainer()
const mountPoint = createMountPoint(container)
const root = ReactDOM.createRoot(mountPoint)

// Renderizar el componente Embedded, pasando la configuración
root.render(
  <React.StrictMode>
    <Embedded config={config} />
  </React.StrictMode>
)
