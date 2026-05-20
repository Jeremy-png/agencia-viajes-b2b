import React from "react";
import { useParams, Link } from "react-router-dom";

const PAGES = {
  nosotros: {
    title: "Quiénes somos",
    icon: "🏢",
    content: [
      {
        subtitle: "Nuestra misión",
        text: "ViajExpress es una agencia de viajes digital B2B que conecta a viajeros con las mejores cadenas hoteleras internacionales. Operamos como intermediario tecnológico, ofreciendo una plataforma multi-proveedor que compara precios y disponibilidad en tiempo real desde múltiples sistemas hoteleros.",
      },
      {
        subtitle: "Cómo funcionamos",
        text: "Nos integramos directamente con los sistemas de reservas de cada cadena hotelera mediante servicios REST. Al buscar, consultamos todos los proveedores configurados simultáneamente, normalizamos los resultados y los mostramos ordenados por precio. Aplicamos un porcentaje de servicio transparente como ganancia de la agencia.",
      },
      {
        subtitle: "Nuestros destinos",
        text: "Operamos con hoteles en Europa (París, Roma, Barcelona), Asia (Tokyo), Medio Oriente (Dubai) y América (Nueva York, Cancún, Buenos Aires). Nuevas cadenas y destinos se agregan dinámicamente desde el panel de administración.",
      },
      {
        subtitle: "Tecnología",
        text: "Sistema B2B desarrollado con arquitectura de microservicios. Backend Python (FastAPI), base de datos MySQL, frontend React. Comunicación entre sistemas exclusivamente vía REST. Proyecto académico — Universidad del Istmo (UNIS), Ingeniería en Sistemas.",
      },
      {
        subtitle: "Contacto",
        text: "📞 +502 2345-6789 | 📧 info@viajexpress.gt | 📍 Ciudad de Guatemala, Guatemala",
      },
    ],
  },

  cancelaciones: {
    title: "Proceso de cancelación",
    icon: "❌",
    content: [
      {
        subtitle: "Política de cancelación",
        text: "Puedes cancelar tu reserva hasta 24 horas antes de la fecha de check-in. Las cancelaciones realizadas con menos de 24 horas de anticipación pueden estar sujetas a cargos según la política específica de cada cadena hotelera.",
      },
      {
        subtitle: "¿Cómo cancelo mi reserva?",
        text: "1. Inicia sesión en tu cuenta.\n2. Ve a 'Mis Reservas' en el menú de perfil.\n3. Localiza la reserva que deseas cancelar.\n4. Haz clic en el botón 'Cancelar reserva'.\n5. Confirma la acción.\n\nRecibirás un correo electrónico de confirmación de cancelación automáticamente.",
      },
      {
        subtitle: "Cancelación por el administrador",
        text: "Los administradores de la agencia pueden cancelar cualquier reserva activa desde el panel de administración. En ese caso, el cliente recibe una notificación por email indicando el motivo.",
      },
      {
        subtitle: "Cancelación por el hotel",
        text: "Si la cadena hotelera cancela tu reserva por motivos operativos, recibirás una notificación inmediata por correo electrónico. El sistema actualiza automáticamente el estado de tu reserva en la plataforma.",
      },
      {
        subtitle: "Política de reembolso",
        text: "Los reembolsos se procesan a través de la cadena hotelera correspondiente. El tiempo de procesamiento puede variar entre 3 y 10 días hábiles dependiendo de tu banco y la política del proveedor.",
      },
    ],
  },

  "hoteles-afiliados": {
    title: "Hoteles y cadenas afiliadas",
    icon: "🏨",
    content: [
      {
        subtitle: "Integración B2B con cadenas internacionales",
        text: "ViajExpress se conecta con cadenas hoteleras mediante servicios REST empresariales. Cada cadena expone una API de integración que permite consultar disponibilidad, realizar reservas y gestionar cancelaciones en tiempo real.",
      },
      {
        subtitle: "🌎 HotelChain Europa & Asia",
        text: "Cadena premium con presencia en destinos europeos y asiáticos de primer nivel:\n\n• Hotel Le Marais Paris — París, Francia\n• Grand Hotel Roma Colosseo — Roma, Italia\n• Tokyo Shinjuku Tower Hotel — Tokyo, Japón\n• Hotel Arts Barcelona Mar — Barcelona, España\n\nHabitaciones disponibles: Doble, Junior Suite, Suite, Gran Suite.",
      },
      {
        subtitle: "🌎 HotelChain Americas",
        text: "Cadena enfocada en los mejores destinos del continente americano y Medio Oriente:\n\n• Manhattan Skyline Hotel — Nueva York, EE.UU.\n• Cancun Beach Resort & Spa — Cancún, México\n• Hotel Palacio Buenos Aires — Buenos Aires, Argentina\n• Dubai Marina Tower Hotel — Dubai, EAU\n\nHabitaciones disponibles: Doble, Junior Suite, Suite, Gran Suite.",
      },
      {
        subtitle: "Cómo se aplican los precios",
        text: "Los precios que ves en la plataforma incluyen el porcentaje de servicio de la agencia (markup), que se configura individualmente por proveedor desde el panel de administración. Siempre mostramos el precio base del proveedor y el precio final con el markup aplicado.",
      },
      {
        subtitle: "¿Quieres integrar tu cadena?",
        text: "Si representas una cadena hotelera y deseas integrarte como proveedor B2B, comunícate con nosotros. El proceso de integración es estándar y utiliza REST con autenticación JWT.",
      },
    ],
  },

  terminos: {
    title: "Términos y condiciones",
    icon: "📋",
    content: [
      {
        subtitle: "1. Aceptación de términos",
        text: "Al utilizar ViajExpress, aceptas estos términos y condiciones. Si no estás de acuerdo con alguno de ellos, por favor abstente de usar la plataforma.",
      },
      {
        subtitle: "2. Naturaleza del servicio",
        text: "ViajeExpress actúa como intermediario tecnológico entre el usuario y las cadenas hoteleras. El contrato final de hospedaje se establece directamente entre el usuario y la cadena hotelera. ViajExpress no es responsable por la calidad del servicio prestado por los hoteles.",
      },
      {
        subtitle: "3. Reservaciones",
        text: "Las reservaciones están sujetas a disponibilidad al momento de confirmar la compra. ViajExpress no garantiza la disponibilidad hasta que la reserva es confirmada por el sistema del proveedor.",
      },
      {
        subtitle: "4. Precios y cargos",
        text: "Los precios mostrados incluyen el porcentaje de servicio de la agencia. Los impuestos locales aplicables en el destino son responsabilidad del usuario. Los precios pueden variar según la disponibilidad y la fecha de consulta.",
      },
      {
        subtitle: "5. Datos personales y pago",
        text: "Recopilamos únicamente los datos necesarios para procesar tu reserva. Los datos de tarjeta de crédito se manejan de forma segura: solo almacenamos los últimos 4 dígitos para identificación. El CVV nunca se almacena. No vendemos ni compartimos datos con terceros con fines comerciales.",
      },
      {
        subtitle: "6. Limitación de responsabilidad",
        text: "ViajExpress no se hace responsable por cambios o cancelaciones realizadas por las cadenas hoteleras, condiciones climáticas, eventos de fuerza mayor, o cualquier circunstancia fuera de nuestro control que afecte las reservas.",
      },
    ],
  },

  privacidad: {
    title: "Política de privacidad",
    icon: "🔒",
    content: [
      {
        subtitle: "Datos que recopilamos",
        text: "Para el registro: nombre completo, correo electrónico, número de pasaporte, país de origen, edad y contraseña.\n\nPara reservas: datos del huésped principal (nombre, apellidos, fecha de nacimiento, nacionalidad) y últimos 4 dígitos de la tarjeta de pago.",
      },
      {
        subtitle: "Uso de los datos",
        text: "Utilizamos tus datos para: procesar y confirmar reservaciones, enviarte notificaciones por correo (confirmaciones, cancelaciones, cambios), mejorar la experiencia de usuario en la plataforma y cumplir con obligaciones legales aplicables.",
      },
      {
        subtitle: "Compartición de datos",
        text: "Compartimos los datos estrictamente necesarios con las cadenas hoteleras para procesar tu reserva (nombre, contacto, número de pasaporte). No vendemos ni compartimos información personal con terceros para fines publicitarios o comerciales.",
      },
      {
        subtitle: "Seguridad",
        text: "Las contraseñas se almacenan con hash criptográfico (PBKDF2-SHA256). Los tokens de sesión son JWT con expiración. La comunicación entre sistemas se realiza exclusivamente a través de servidores backend, nunca desde el navegador directamente.",
      },
      {
        subtitle: "Tus derechos",
        text: "Tienes derecho a acceder, corregir o solicitar la eliminación de tus datos personales. Para ejercer estos derechos contacta a: privacidad@viajexpress.gt\n\nPuedes solicitar un reporte de tus datos en cualquier momento desde tu cuenta.",
      },
      {
        subtitle: "Retención de datos",
        text: "Conservamos tus datos de usuario mientras tu cuenta esté activa. Los registros de reservas se mantienen por 5 años por razones contables y legales. Puedes solicitar la eliminación de tu cuenta en cualquier momento.",
      },
    ],
  },
};

export default function InfoPage() {
  const { seccion } = useParams();
  const page = PAGES[seccion];

  if (!page) return (
    <div className="container" style={{ paddingTop: 60, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
      <div className="h1" style={{ marginBottom: 8 }}>Página no encontrada</div>
      <p className="muted" style={{ marginBottom: 20 }}>Esta sección no existe.</p>
      <Link to="/">
        <button className="btn-blue" style={{ borderRadius: 10 }}>← Ir al inicio</button>
      </Link>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 820 }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/" style={{ color: "var(--brand-dark)", fontSize: 13, fontWeight: 600 }}>
          ← Volver al inicio
        </Link>
      </div>

      <div style={{ fontSize: 48, marginBottom: 12 }}>{page.icon}</div>
      <h1 style={{ margin: "0 0 28px" }}>{page.title}</h1>

      <div style={{ display: "grid", gap: 14 }}>
        {page.content.map(({ subtitle, text }) => (
          <div key={subtitle} className="card">
            <div style={{
              fontWeight: 700, marginBottom: 10,
              color: "var(--brand-dark)", fontSize: 15,
            }}>
              {subtitle}
            </div>
            <div style={{
              lineHeight: 1.75, whiteSpace: "pre-line",
              color: "var(--text-2)", fontSize: 14,
            }}>
              {text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link to="/buscar">
          <button className="btn-blue" style={{ padding: "11px 28px", borderRadius: 10 }}>
            🔍 Buscar hoteles
          </button>
        </Link>
      </div>
    </div>
  );
}
