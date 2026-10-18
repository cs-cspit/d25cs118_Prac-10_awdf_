function ErrorMessage({ message }) {
  return (
    <div className="error-card" role="alert">
      <h3>Error Loading Tasks</h3>
      <p>{message}</p>
      <p className="error-hint">Make sure MongoDB is running and the backend server is on port 5000</p>
    </div>
  )
}

export default ErrorMessage
