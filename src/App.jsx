import React from 'react';
import Calendar from './Calendar';
import { Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Container fluid>
      <Row className="mb-3">
        <Col>
          <h1 className="text-center my-4">Calendario de Eventos</h1>
        </Col>
      </Row>
      <Row>
        <Col>
          <Calendar />
        </Col>
      </Row>
    </Container>
  );
}

export default App;