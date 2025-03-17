import React, { useState, useEffect } from "react"
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns"
import es from "date-fns/locale/es"
import axios from "axios"
import "react-big-calendar/lib/css/react-big-calendar.css"
import ErrorBoundary from "./ErrorBoundary"
import { Modal, Button, Form } from "react-bootstrap"

const API_URL = "http://localhost:5000"; // o 3001

// Localizador de fechas
const locales = {
  "es-AR": es,
}

const localizer = dateFnsLocalizer({
  format: (date, formatStr, culture = "es-AR") =>
    format(date, formatStr, { locale: locales[culture] }),
  parse: (date, formatStr, culture = "es-AR") =>
    parse(date, formatStr, new Date(), { locale: locales[culture] }),
  startOfWeek: (culture = "es-AR") =>
    startOfWeek(new Date(), { locale: locales[culture] }),
  getDay: (date) => getDay(date),
  locales,
})

// Mensajes en español
const messages = {
  allDay: "Todo el día",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "No hay eventos en este rango",
  showMore: (total) => `+ Ver más (${total})`,
}

// Define las vistas disponibles
const views = {
  month: true,
  week: true,
  day: true,
  agenda: true,
}

// Función para crear objetos Date a partir de fecha y hora
function createDateTimeFromStrings(dateString, timeString) {
  if (!dateString) return new Date()

  // Asegurarse de que la fecha esté en formato YYYY-MM-DD
  const datePart = dateString.split("T")[0].split(" ")[0]

  // Validar el formato de hora y establecer un valor por defecto si no es válido
  const timePart =
    timeString && /^\d{2}:\d{2}$/.test(timeString) ? timeString : "00:00"

  // Crear fecha con la hora específica
  const dateTime = new Date(`${datePart}T${timePart}`)

  // Si la fecha es inválida, devolver la fecha actual
  return isNaN(dateTime) ? new Date() : dateTime
}

const Calendar = () => {
  const [events, setEvents] = useState([])
  const [newEvent, setNewEvent] = useState({
    nombre: "",
    fecha: new Date().toISOString().split("T")[0],
    hora_inicio: "09:00",
    hora_fin: "10:00",
    lugar: "",
    tipo_actividad: "",
    empresa: "",
    disertantes: "",
    descripcion: "",
  })
  const [showModal, setShowModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [view, setView] = useState("month")
  const [date, setDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)

  // Función para cargar eventos desde la API
  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${API_URL}/events`)
      console.log("Eventos recibidos del servidor:", response.data.events)

      const formattedEvents = response.data.events.map((event) => {
        const startDate = createDateTimeFromStrings(
          event.fecha,
          event.hora_inicio || "00:00"
        )
        const endDate = createDateTimeFromStrings(
          event.fecha,
          event.hora_fin || "23:59"
        )

        console.log(
          `Evento: ${event.nombre}, Inicio: ${startDate}, Fin: ${endDate}`
        )

        return {
          id: event.id,
          title: event.nombre,
          start: startDate,
          end: endDate,
          allDay: !event.hora_inicio && !event.hora_fin, // Marcar como todo el día si no hay horas definidas
          ...event,
        }
      })

      console.log("Eventos formateados para el calendario:", formattedEvents)
      setEvents(formattedEvents)
    } catch (error) {
      console.error("Error al cargar los eventos:", error)
      alert("Error al cargar los eventos. Por favor, recarga la página.")
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar eventos al inicio y cuando cambie refreshCounter
  useEffect(() => {
    console.log("Ejecutando fetchEvents. refreshCounter:", refreshCounter)
    fetchEvents()
  }, [refreshCounter])

  // Crear un nuevo evento
  const handleAddEvent = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log("Enviando nuevo evento:", newEvent)
      // Cambia el puerto a 5000 para usar el mismo servidor SQLite
      const response = await axios.post(
        "http://localhost:5000/events",
        newEvent
      )
      console.log("Respuesta del servidor:", response.data)

      alert("Evento creado exitosamente")
      setNewEvent({
        nombre: "",
        fecha: new Date().toISOString().split("T")[0],
        hora_inicio: "09:00",
        hora_fin: "10:00",
        lugar: "",
        tipo_actividad: "",
        empresa: "",
        disertantes: "",
        descripcion: "",
      })
      setShowModal(false)

      // Incrementar el contador para forzar una recarga
      setRefreshCounter((prev) => prev + 1)
    } catch (error) {
      console.error("Error al crear el evento:", error)
      alert("Error al crear el evento. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Actualizar un evento
  const handleUpdateEvent = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const eventToUpdate = {
        ...selectedEvent,
      }
      console.log("Actualizando evento:", eventToUpdate)

      const response = await axios.put(
        `http://localhost:5000/events/${selectedEvent.id}`,
        eventToUpdate
      )
      console.log("Respuesta del servidor:", response.data)

      alert("Evento actualizado exitosamente")
      setShowEventModal(false)

      // Incrementar el contador para forzar una recarga
      setRefreshCounter((prev) => prev + 1)
    } catch (error) {
      console.error("Error al actualizar el evento:", error)
      alert("Error al actualizar el evento. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar un evento
  const handleDeleteEvent = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este evento?"))
      return

    setIsLoading(true)
    try {
      await axios.delete(`http://localhost:5000/events/${selectedEvent.id}`)

      alert("Evento eliminado exitosamente")
      setShowEventModal(false)

      // Incrementar el contador para forzar una recarga
      setRefreshCounter((prev) => prev + 1)
    } catch (error) {
      console.error("Error al eliminar el evento:", error)
      alert("Error al eliminar el evento. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Manejador de cambio en el formulario de nuevo evento
  const handleChange = (e) => {
    const { name, value } = e.target
    setNewEvent((prev) => ({ ...prev, [name]: value }))
  }

  // Manejador de cambio en el formulario de actualización
  const handleUpdateChange = (e) => {
    const { name, value } = e.target
    setSelectedEvent((prev) => ({ ...prev, [name]: value }))
  }

  // Seleccionar un evento para ver/editar
  const handleSelectEvent = (event) => {
    console.log("Evento seleccionado:", event)

    // Extraer la fecha en formato YYYY-MM-DD
    const fechaFormateada = event.fecha ? event.fecha.split("T")[0] : ""

    // Preparar hora_inicio y hora_fin desde el evento o usar valores por defecto
    const horaInicio = event.hora_inicio || format(event.start, "HH:mm")
    const horaFin = event.hora_fin || format(event.end, "HH:mm")

    setSelectedEvent({
      ...event,
      fecha: fechaFormateada,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    })
    setShowEventModal(true)
  }

  // Manejadores para la navegación del calendario
  const handleViewChange = (newView) => {
    setView(newView)
  }

  const handleNavigate = (newDate) => {
    setDate(newDate)
  }

  // Función para validar que hora_fin sea después de hora_inicio
  const validateHoraFin = () => {
    // Para formulario nuevo evento
    if (
      newEvent.hora_inicio &&
      newEvent.hora_fin &&
      newEvent.hora_fin <= newEvent.hora_inicio
    ) {
      alert("La hora de fin debe ser posterior a la hora de inicio")
      setNewEvent((prev) => ({
        ...prev,
        hora_fin: addMinutes(new Date(`2000-01-01T${prev.hora_inicio}`), 30)
          .toTimeString()
          .slice(0, 5),
      }))
    }

    // Para formulario editar evento
    if (
      selectedEvent &&
      selectedEvent.hora_inicio &&
      selectedEvent.hora_fin &&
      selectedEvent.hora_fin <= selectedEvent.hora_inicio
    ) {
      alert("La hora de fin debe ser posterior a la hora de inicio")
      setSelectedEvent((prev) => ({
        ...prev,
        hora_fin: addMinutes(new Date(`2000-01-01T${prev.hora_inicio}`), 30)
          .toTimeString()
          .slice(0, 5),
      }))
    }
  }

  return (
    <ErrorBoundary>
      <div style={{ height: "100vh", padding: "10px", position: "relative" }}>
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255,255,255,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div>Cargando...</div>
          </div>
        )}

        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "calc(100% - 50px)" }}
          messages={messages}
          views={views}
          onSelectEvent={handleSelectEvent}
          defaultView="month"
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleNavigate}
          popup
          titleAccessor="nombre"
        />

        <div className="mt-3">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Agregar Evento
          </Button>

          <Button
            variant="secondary"
            onClick={() => setRefreshCounter((prev) => prev + 1)}
            className="ml-2"
            style={{ marginLeft: "10px" }}
          >
            Actualizar Calendario
          </Button>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Agregar Evento</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleAddEvent}>
              <Form.Group controlId="formNombre">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={newEvent.nombre}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="formFecha">
                <Form.Label>Fecha</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha"
                  value={newEvent.fecha}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <div className="d-flex gap-2">
                <Form.Group controlId="formHoraInicio" className="flex-grow-1">
                  <Form.Label>Hora de inicio</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora_inicio"
                    value={newEvent.hora_inicio}
                    onChange={handleChange}
                    onBlur={validateHoraFin}
                  />
                </Form.Group>
                <Form.Group controlId="formHoraFin" className="flex-grow-1">
                  <Form.Label>Hora de fin</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora_fin"
                    value={newEvent.hora_fin}
                    onChange={handleChange}
                    onBlur={validateHoraFin}
                  />
                </Form.Group>
              </div>
              <Form.Group controlId="formLugar">
                <Form.Label>Lugar</Form.Label>
                <Form.Control
                  type="text"
                  name="lugar"
                  placeholder="Lugar"
                  value={newEvent.lugar}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="formTipoActividad">
                <Form.Label>Tipo de Actividad</Form.Label>
                <Form.Control
                  type="text"
                  name="tipo_actividad"
                  placeholder="Tipo de Actividad"
                  value={newEvent.tipo_actividad}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="formEmpresa">
                <Form.Label>Empresa</Form.Label>
                <Form.Control
                  type="text"
                  name="empresa"
                  placeholder="Empresa"
                  value={newEvent.empresa}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="formDisertantes">
                <Form.Label>Disertantes</Form.Label>
                <Form.Control
                  type="text"
                  name="disertantes"
                  placeholder="Disertantes"
                  value={newEvent.disertantes}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group controlId="formDescripcion">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  name="descripcion"
                  placeholder="Descripción"
                  value={newEvent.descripcion}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                disabled={isLoading}
                className="mt-3"
              >
                {isLoading ? "Guardando..." : "Agregar Evento"}
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {selectedEvent && (
          <Modal show={showEventModal} onHide={() => setShowEventModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Detalles del Evento</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleUpdateEvent}>
                <Form.Group controlId="formNombre">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    placeholder="Nombre"
                    value={selectedEvent.nombre}
                    onChange={handleUpdateChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="formFecha">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    placeholder="Fecha"
                    value={selectedEvent.fecha}
                    onChange={handleUpdateChange}
                    required
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Form.Group
                    controlId="formEditHoraInicio"
                    className="flex-grow-1"
                  >
                    <Form.Label>Hora de inicio</Form.Label>
                    <Form.Control
                      type="time"
                      name="hora_inicio"
                      value={selectedEvent.hora_inicio || ""}
                      onChange={handleUpdateChange}
                      onBlur={validateHoraFin}
                    />
                  </Form.Group>
                  <Form.Group
                    controlId="formEditHoraFin"
                    className="flex-grow-1"
                  >
                    <Form.Label>Hora de fin</Form.Label>
                    <Form.Control
                      type="time"
                      name="hora_fin"
                      value={selectedEvent.hora_fin || ""}
                      onChange={handleUpdateChange}
                      onBlur={validateHoraFin}
                    />
                  </Form.Group>
                </div>
                <Form.Group controlId="formLugar">
                  <Form.Label>Lugar</Form.Label>
                  <Form.Control
                    type="text"
                    name="lugar"
                    placeholder="Lugar"
                    value={selectedEvent.lugar}
                    onChange={handleUpdateChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="formTipoActividad">
                  <Form.Label>Tipo de Actividad</Form.Label>
                  <Form.Control
                    type="text"
                    name="tipo_actividad"
                    placeholder="Tipo de Actividad"
                    value={selectedEvent.tipo_actividad}
                    onChange={handleUpdateChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="formEmpresa">
                  <Form.Label>Empresa</Form.Label>
                  <Form.Control
                    type="text"
                    name="empresa"
                    placeholder="Empresa"
                    value={selectedEvent.empresa}
                    onChange={handleUpdateChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="formDisertantes">
                  <Form.Label>Disertantes</Form.Label>
                  <Form.Control
                    type="text"
                    name="disertantes"
                    placeholder="Disertantes"
                    value={selectedEvent.disertantes}
                    onChange={handleUpdateChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="formDescripcion">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="descripcion"
                    placeholder="Descripción"
                    value={selectedEvent.descripcion}
                    onChange={handleUpdateChange}
                    required
                  />
                </Form.Group>
                <div className="d-flex justify-content-between mt-3">
                  <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Actualizar Evento"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeleteEvent}
                    disabled={isLoading}
                  >
                    {isLoading ? "Eliminando..." : "Eliminar Evento"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default Calendar
