export default function StatusAlerts({ errorMessage, successMessage }) {
  return <>
    {errorMessage && <p className="alert error">{errorMessage}</p>}
    {successMessage && <p className="alert success">{successMessage}</p>}
  </>;
}
