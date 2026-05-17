import React from "react";
import { useParams, Link } from "react-router-dom";

const PAGES = {
  nosotros: {
    title: "Quiénes somos",
    icon: "🏢",
    content: [
      { subtitle: "Nuestra misión", text: "ViajesB2B es una agencia de viajes digital que conecta a viajeros con las mejores cadenas hoteleras de Guatemala y Centroamérica. Ofrecemos una plataforma multi-proveedor que te permite comparar precios y disponibilidad en tiempo real." },
      { subtitle: "Cómo funcionamos", text: "Nos conectamos directamente con los sistemas de reservas de cada cadena hotelera, obtenemos los precios en tiempo real y te los presentamos ordenados de menor a mayor precio. Agregamos un pequeño porcentaje de servicio para mantener la plataforma, que siempre se muestra de forma transparente." },
      { subtitle: "Nuestro equipo", text: "Somos un equipo de desarrolladores e ingenieros en sistemas comprometidos con facilitar los viajes en la región centroamericana a través de la tecnología." },
      { subtitle: "Contáctanos", text: "📞 +502 2345-6789 | 📧 info@viajesb2b.gt | 📍 Zona 10, Ciudad de Guatemala" },
    ]
  },
  cancelaciones: {
    title: "Proceso de cancelación",
    icon: "❌",
    content: [
      { subtitle: "¿Cuándo puedo cancelar?", text: "Puedes cancelar tu reserva hasta 24 horas antes de la fecha de check-in. Cancelaciones realizadas con menos de 24 horas de anticipación pueden estar sujetas a cargos según la política de la cadena hotelera." },
      { subtitle: "¿Cómo cancelo?", text: "1. Inicia sesión en tu cuenta.\n2. Ve a 'Mis Reservas' en el menú de perfil.\n3. Encuentra la reserva que deseas cancelar.\n4. Haz click en el botón 'Cancelar'.\n5. Confirma la cancelación.\nRecibirás un correo de confirmación de cancelación." },
      { subtitle: "Política de reembolso", text: "Los reembolsos se procesan directamente a través de la cadena hotelera. El tiempo de procesamiento puede variar entre 3 y 10 días hábiles dependiendo de tu banco y la política del hotel." },
      { subtitle: "Cancelaciones por el hotel", text: "En caso de que el hotel cancele tu reserva, recibirás una notificación inmediata por correo electrónico y la reserva se actualizará en tu cuenta. El reembolso se procesará automáticamente." },
    ]
  },
  "hoteles-afiliados": {
    title: "Hoteles y cadenas afiliadas",
    icon: "🏨",
    content: [
      { subtitle: "Nuestras cadenas afiliadas", text: "Trabajamos con cadenas hoteleras seleccionadas que cumplen con nuestros estándares de calidad y servicio al cliente." },
      { subtitle: "HotelChain A", text: "Cadena premium con presencia en las principales ciudades de Guatemala. Ofrece habitaciones dobles, junior suites, suites y gran suites con todas las comodidades modernas. Destinos: Guatemala, Antigua, Quetzaltenango." },
      { subtitle: "HotelChain B", text: "Cadena boutique especializada en experiencias únicas y hospedaje de calidad en destinos turísticos. Destinos: Flores, Cobán, Antigua Guatemala." },
      { subtitle: "¿Quieres afiliarte?", text: "Si eres propietario de una cadena hotelera y deseas integrarte a nuestra plataforma, contáctanos en: socios@viajesb2b.gt" },
    ]
  },
  terminos: {
    title: "Términos y condiciones",
    icon: "📋",
    content: [
      { subtitle: "1. Aceptación", text: "Al usar ViajesB2B, aceptas estos términos y condiciones. Si no estás de acuerdo, por favor no uses la plataforma." },
      { subtitle: "2. Reservaciones", text: "Las reservaciones son sujetas a disponibilidad. ViajesB2B actúa como intermediario entre el usuario y las cadenas hoteleras. El contrato final de hospedaje es entre el usuario y el hotel." },
      { subtitle: "3. Precios", text: "Los precios mostrados incluyen el porcentaje de servicio de la agencia. Los impuestos aplicables son responsabilidad del usuario y pueden variar según el destino." },
      { subtitle: "4. Datos personales", text: "Guardamos únicamente los datos necesarios para procesar tu reserva. Los datos de tarjeta de crédito se manejan de forma segura: solo almacenamos los últimos 4 dígitos para identificación. Nunca almacenamos el CVV." },
      { subtitle: "5. Responsabilidad", text: "ViajesB2B no se hace responsable por cambios o cancelaciones realizadas por las cadenas hoteleras, condiciones climáticas, o cualquier circunstancia fuera de nuestro control." },
    ]
  },
  privacidad: {
    title: "Política de privacidad",
    icon: "🔒",
    content: [
      { subtitle: "¿Qué datos recopilamos?", text: "Recopilamos: nombre completo, correo electrónico, número de pasaporte, país de origen y fecha de nacimiento para el registro. Para reservas: datos del huésped y últimos 4 dígitos de tarjeta." },
      { subtitle: "¿Para qué usamos tus datos?", text: "Usamos tus datos para: procesar reservaciones, enviarte confirmaciones por correo, mejorar tu experiencia en la plataforma y cumplir con obligaciones legales." },
      { subtitle: "¿Compartimos tus datos?", text: "Compartimos los datos necesarios con las cadenas hoteleras para procesar tu reserva. No vendemos ni compartimos datos con terceros con fines comerciales." },
      { subtitle: "Tus derechos", text: "Tienes derecho a acceder, corregir o eliminar tus datos personales. Para ejercer estos derechos contáctanos en: privacidad@viajesb2b.gt" },
      { subtitle: "Seguridad", text: "Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos. Las contraseñas se almacenan con hash seguro y nunca en texto plano." },
    ]
  },
};

export default function InfoPage() {
  const { seccion } = useParams();
  const page = PAGES[seccion];

  if (!page) return (
    <div className="container" style={{ paddingTop: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div className="h1">Página no encontrada</div>
      <Link to="/"><button className="btn btn-primary" style={{ marginTop: 16 }}>Ir al inicio</button></Link>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" className="muted" style={{ fontSize: 13 }}>← Inicio</Link>
      </div>

      <div style={{ fontSize: 48, marginBottom: 12 }}>{page.icon}</div>
      <h1 style={{ margin: "0 0 24px" }}>{page.title}</h1>

      <div style={{ display: "grid", gap: 16 }}>
        {page.content.map(({ subtitle, text }) => (
          <div key={subtitle} className="card">
            <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--brand)" }}>
              {subtitle}
            </div>
            <div style={{ lineHeight: 1.7, whiteSpace: "pre-line", color: "var(--muted)", fontSize: 14 }}>
              {text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link to="/buscar">
          <button className="btn btn-primary" style={{ padding: "12px 28px" }}>
            Buscar hoteles
          </button>
        </Link>
      </div>
    </div>
  );
}
