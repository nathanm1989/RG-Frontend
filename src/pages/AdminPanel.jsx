import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Table,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Modal,
} from "react-bootstrap";

const useDebouncedCallback = (callback, delay = 500) => {
  const timeoutRef = useRef(null);

  const debouncedFn = (...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  };

  return debouncedFn;
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [devList, setDevList] = useState([]);
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "bidder",
  });
  const [passwordEdits, setPasswordEdits] = useState({});

  const debouncedUpdatePassword = useDebouncedCallback(async (id, password) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${id}/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      if (res.ok) {
        fetchUsers(); // refresh user list
      } else {
        alert("Failed to update password");
      }
    }
    catch (error) {
      console.error("Error updating password:", error);
    }
  }, 500);


  const fetchUsers = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/admin/users`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    const data = await res.json();
    if (res.ok) {
      setUsers(data);
      const devs = data.filter((u) => u.role === "developer");
      setDevList(devs);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    if (res.ok) {
      setMessage("User deleted successfully!");
      fetchUsers();
    } else {
      alert("Failed to delete user");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${id}/role`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ role: newRole }),
      }
    );
    if (res.ok) {
      setMessage("User role updated!");
      fetchUsers();
    } else {
      alert("Failed to change role");
    }
  };

  const handleAssignBidder = async (bidderId, devId) => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/admin/assign-bidder`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ bidderId, developerId: devId }),
      }
    );
    if (res.ok) {
      setMessage("Bidder assigned!");
      fetchUsers();
    } else {
      alert("Failed to assign bidder");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/admin/create-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(newUser),
      }
    );
    if (res.ok) {
      fetchUsers();
      setShowModal(false);
      setNewUser({ username: "", password: "", role: "bidder" });
    } else {
      alert("Failed to create user");
    }
  };

  return (
    <Container className="mt-4">
      {message && (
        <Alert variant="success" onClose={() => setMessage(null)} dismissible>
          {message}
        </Alert>
      )}
      {/* Users Table */}
      <section>
        <h4>All Users</h4>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Password</th>
              <th>Change Role</th>
              <th>Assign Developer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>
                  {u.role !== "admin" && (
                    <Form.Control
                      size="sm"
                      type="text"
                      value={passwordEdits[u.id] ?? u.password}
                      onChange={(e) => {
                        const newPass = e.target.value;
                        setPasswordEdits((prev) => ({
                          ...prev,
                          [u.id]: newPass,
                        }));
                        debouncedUpdatePassword(u.id, newPass);
                      }}
                    />
                  )}
                </td>
                <td>
                  {u.role !== "admin" && (
                    <Form.Select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="bidder">Bidder</option>
                      <option value="developer">Developer</option>
                    </Form.Select>
                  )}
                </td>
                <td>
                  {u.role === "bidder" && (
                    <Form.Select
                      value={u.developerId || ""}
                      onChange={(e) => handleAssignBidder(u.id, e.target.value)}
                    >
                      <option value="" disabled>
                        Assign to...
                      </option>
                      {devList.map((dev) => (
                        <option key={dev.id} value={dev.id}>
                          {dev.username}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </td>
                <td>
                  {u.role !== "admin" && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(u.id)}
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
      <Button className="mb-3" onClick={() => setShowModal(true)}>
        Add User
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Username</Form.Label>
              <Form.Control
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Password</Form.Label>
              <Form.Control
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="bidder">Bidder</option>
                <option value="developer">Developer</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateUser}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPanel;
