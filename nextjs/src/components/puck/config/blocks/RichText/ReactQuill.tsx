// Wrapper component that can be dynamically loaded, to disable broken SSR
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const Parchment = Quill.import('parchment')
const SizeClass = new Parchment.Attributor.Class('size', 'size', {
  scope: Parchment.Scope.INLINE,
  whitelist: ['small', 'medium', 'large', 'huge'],
})
Quill.register(SizeClass, true)
export default ReactQuill
