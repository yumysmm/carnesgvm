export default function Footer({ settings }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <b>Cali Carnes</b>
          Carne fresca seleccionada, empacada al vacío y entregada a domicilio.
        </div>
        <div className="footer-col">
          <b>Contacto</b>
          WhatsApp: {settings.whatsapp_cali ? `+${settings.whatsapp_cali}` : "—"}
          <br />
          Envíos dentro de Cali
        </div>
        <div className="footer-col">
          <b>Horario</b>
          Lunes a sábado
          <br />
          8:00am – 6:00pm
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} Cali Carnes. Todos los derechos reservados.</div>
    </footer>
  );
}
