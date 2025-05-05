import "./App.css";
import { Container, Form, FormGroup, Button, Label, Input } from 'reactstrap';

function App() {
  return (
    <Container className="mt-5" align="center">
      <Form className="w-50 mx-auto">
        <FormGroup>
          <Label for="exampleEmail" hidden>Email</Label>
          <Input id="exampleEmail" name="email" placeholder="Email" type="email" />
        </FormGroup>
        <FormGroup>
          <Label for="examplePassword" hidden>Password</Label>
          <Input id="examplePassword" name="password" placeholder="Password" type="password" />
        </FormGroup>
        <Button>Submit</Button>
      </Form>
    </Container>
  );
}

export default App;