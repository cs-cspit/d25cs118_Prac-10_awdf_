function Spinner({ label = 'Loading tasks…' }) {
  return (
    <div className="spinner" role="status" aria-label={label}>
      <span className="spinner-ring" />
      <span>{label}</span>
    </div>
  )
}

export default Spinner
