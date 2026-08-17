export default function Footer({ settings }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <b>Carnexpress Lite</b>
          Carne fresca seleccionada, empacada al vacío y entregada a domicilio el mismo día.
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
      <div className="footer-bottom">© {new Date().getFullYear()} Carnexpress Lite. Todos los derechos reservados.</div>
    </footer>
  );
}
