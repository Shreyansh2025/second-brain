import { useContext } from 'react'
import { ResourceContext } from '../context/resource-context.js'

export function useResources() {
  return useContext(ResourceContext)
}