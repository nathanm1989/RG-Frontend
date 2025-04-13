import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          ResumeGen
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto">
            {!user ? (
              <>
                <Nav.Link as={Link} to="/signin">
                  Sign In
                </Nav.Link>
              </>
            ) : (
              <>
                {user.role === "bidder" && (
                  <>
                    <Nav.Link as={Link} to="/bidding">
                      Bidding
                    </Nav.Link>
                    <Nav.Link as={Link} to="/dashboard">
                      Dashboard
                    </Nav.Link>
                  </>
                )}

                {user.role === "developer" && (
                  <Nav.Link as={Link} to="/dev-dashboard">
                    Dev Dashboard
                  </Nav.Link>
                )}

                {user.role === "admin" && (
                  <Nav.Link as={Link} to="/admin">
                    Admin Panel
                  </Nav.Link>
                )}

                <Button
                  variant="outline-light"
                  className="ms-2"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
