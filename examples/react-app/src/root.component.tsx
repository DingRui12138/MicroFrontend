import { useState } from 'react'
import { Navigate, HashRouter, Routes, Route, NavLink, Link, createHashRouter } from 'react-router-dom'

import './root.scss'
import HomeComponent from './home.component'
import AboutComponent from './about.component'

export default function Root(props) {
  console.log('🚀 ~ file: root.component.tsx:5 ~ Root ~ props:', props)
  // @ts-ignore
  const [count, setCount] = useState(window.count ?? 0)

  const onIncrease = () => {
    // @ts-ignore
    window.count = count + 1
    // @ts-ignore
    setCount(count + 1)
  }

  return (
    <div className="root-content">
      <nav>
        <p>[react-app] global blue nav</p>
      </nav>
      <section>React {props.name} is mounted!</section>
      <div>count: {count}</div>

      <button onClick={() => onIncrease()}>+</button>
    </div>
  )
}
