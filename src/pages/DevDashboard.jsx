import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Dashboard from "./Dashboard";
import {
  Container,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Card,
} from "react-bootstrap";

const DevDashboard = () => {
  const { user } = useAuth();
  const [bidders, setBidders] = useState([]);
  const [selectedBidder, setSelectedBidder] = useState(null);
  const [token, setToken] = useState("");
  const [templateFile, setTemplateFile] = useState(null);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [gptPrompt, setGptPrompt] = useState("");
  const [message, setMessage] = useState(null);

  const fetchBidders = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/dev/bidders`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    const data = await res.json();
    if (res.ok) setBidders(data);
  };

  const fetchOpenAIToken = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/dev/openai-token`,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      }
    );
    const data = await res.json();
    if (res.ok) setToken(data.token || "");
  };

  const handleTokenSave = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/dev/openai-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ token }),
      }
    );
    if (res.ok) setMessage("Token saved!");
  };

  const fetchTemplateInfo = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/dev/template`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      setTemplateInfo(data);
    } else {
      setTemplateInfo(null);
    }
  };

  const handleTemplateUpload = async () => {
    const formData = new FormData();
    formData.append("template", templateFile);

    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/dev/template-upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      }
    );
    if (res.ok) {
      setMessage("Template uploaded!");
      setTemplateFile(null);
      fetchTemplateInfo();
    } else {
      alert("Failed to upload template");
    }
  };

  const deleteTemplate = async () => {
    if (!window.confirm("Delete the current template?")) return;

    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/dev/template`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );
    if (res.ok) {
      setTemplateInfo(null);
      setTemplateFile(null);
      setMessage("Template deleted!");
    } else {
      alert("Failed to delete template");
    }
  };

  const fetchPrompt = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/dev/gpt-prompt`,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      }
    );
    const data = await res.json();
    if (res.ok) setGptPrompt(data.prompt || "");
  };

  const handlePromptSave = async () => {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/dev/gpt-prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ prompt: gptPrompt }),
    });
    setMessage("Prompt saved!");
  };

  useEffect(() => {
    fetchBidders();
    fetchOpenAIToken();
    fetchPrompt();
    fetchTemplateInfo();
  }, []);

  return (
    <Container className="my-4">
      <h2 className="mb-4">Developer Dashboard</h2>

      {message && (
        <Alert
          variant="success"
          onClose={() => setMessage(null)}
          dismissible
        >
          {message}
        </Alert>
      )}

      {/* Token Section */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Your OpenAI Token</Card.Title>
          <Form className="d-flex gap-3">
            <Form.Control
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="OpenAI API Key"
            />
            <Button onClick={handleTokenSave}>Save</Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Prompt Section */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Your Default GPT Prompt</Card.Title>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={5}
              value={gptPrompt}
              onChange={(e) => setGptPrompt(e.target.value)}
              placeholder="Write a default prompt for resume generation"
            />
          </Form.Group>
          <Button className="mt-2" onClick={handlePromptSave}>
            Save Prompt
          </Button>
        </Card.Body>
      </Card>

      {/* Template Section */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Upload Resume Template (.docx)</Card.Title>
          {templateInfo ? (
            <>
              <p>
                <strong>Current Template:</strong> {templateInfo.fileName}
              </p>
              <a
                href={`${process.env.REACT_APP_BACKEND_URL}${templateInfo.fileUrl}`}
                download
              >
                Download Template
              </a>
              <Button
                variant="danger"
                className="ms-3"
                onClick={deleteTemplate}
              >
                Delete Template
              </Button>
            </>
          ) : (
            <>
              <Form.Control
                type="file"
                accept=".docx"
                className="mb-2"
                onChange={(e) => setTemplateFile(e.target.files[0])}
              />
              <Button
                onClick={handleTemplateUpload}
                disabled={!templateFile}
              >
                Upload Template
              </Button>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Bidders Section */}
      <Card>
        <Card.Body>
          <Card.Title>Your Bidders</Card.Title>
          <Form.Select
            className="mb-3"
            onChange={(e) => {
              const id = e.target.value;
              const bidder = bidders.find((b) => b.id === id);
              setSelectedBidder(bidder);
            }}
          >
            <option value="">-- Select Bidder --</option>
            {bidders.map((b) => (
              <option key={b.id} value={b.id}>
                {b.username}
              </option>
            ))}
          </Form.Select>

          {selectedBidder && (
            <div className="mt-4">
              <Dashboard mode="developer" bidderId={selectedBidder.id} />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DevDashboard;
