import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Container,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  ListGroup,
  Card,
  Table,
  Form,
  Pagination,
} from "react-bootstrap";

const Dashboard = ({ mode = "bidder", bidderId = null }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resumeData, setResumeData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // Or 20, up to you
  const [totalPages, setTotalPages] = useState(1);
  const [dateCounts, setDateCounts] = useState({});

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        mode === "bidder"
          ? `${process.env.REACT_APP_BACKEND_URL}/api/bidder/files?page=${page}&limit=${limit}`
          : `${process.env.REACT_APP_BACKEND_URL}/api/dev/bidder-files/${bidderId}?page=${page}&limit=${limit}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (res.status === 401) {
        alert("Session expired. Please sign in again.");
        logout();
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setResumeData(data.files || []);
        setTotalPages(data.totalPages || 1); // { date: [ { name, jdUrl }, ... ] }
        setDateCounts(data.dateCounts || {});
      } else {
        setError(data.message || "Failed to load files");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching files");
    } finally {
      setLoading(false);
    }
  };  

  const handleDelete = async (url) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      const endpoint =
        mode === "bidder"
          ? `${process.env.REACT_APP_BACKEND_URL}/api/bidder/delete-file`
          : `${process.env.REACT_APP_BACKEND_URL}/api/dev/delete-bidder-file/${bidderId}`;

      const res = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ name: url }),
        }
      );

      if (res.ok) {
        fetchFiles();
        alert("File deleted successfully");
      } else {
        alert("Failed to delete file");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting file");
    }
  };

  const downloadZip = async (date) => {
    const url =
      mode === "developer"
        ? `${process.env.REACT_APP_BACKEND_URL}/api/dev/download-folder/${bidderId}?date=${date}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/bidder/download-folder?date=${date}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Failed to download ZIP");
        return;
      }

      const blob = await res.blob();

      if (blob.type !== "application/zip") {
        const text = await blob.text();
        alert("Download failed: " + text);
        return;
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${date}-resumes.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Download error");
    }
  };

  const normalize = (str) => str.toLowerCase().replace(/[\s\-_]/g, "");

  const filteredFiles = resumeData.filter((file) => {
    const matchesName = normalize(file.name).includes(normalize(searchTerm));
    const afterStart = !startDate || file.date >= startDate;
    const beforeEnd = !endDate || file.date <= endDate;
    return matchesName && afterStart && beforeEnd;
  });

  const dateCountMap = filteredFiles.reduce((acc, file) => {
    acc[file.date] = (acc[file.date] || 0) + 1;
    return acc;
  }, {});


  const secureDownload = async (name, extension) => {
    try {
      const endpoint =
        mode === "bidder"
          ? `${process.env.REACT_APP_BACKEND_URL}/api/bidder/download?filePath=${encodeURIComponent(name)}${extension}`
          : `${process.env.REACT_APP_BACKEND_URL}/api/dev/download-resume/${bidderId}?filePath=${encodeURIComponent(name)}${extension}`;

      const res = await fetch(
        endpoint,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (!res.ok) {
        alert("Download failed.");
        return;
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${name}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Secure download error:", err);
      alert("Error downloading file.");
    }
  };

  useEffect(() => {
    if (mode === "developer" && !bidderId) return;
    fetchFiles();
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, bidderId]);

  return (
    <Container className="my-4">
      <h2 className="mb-4">
        {mode === "developer" ? "Bidder's Resumes" : "My Resumes"}
      </h2>

      <Form className="mb-4">
        <Row className="g-3 align-items-end">
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label>Search Filename</Form.Label>
              <Form.Control
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g., FrontendEngineer"
              />
            </Form.Group>
          </Col>

          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col xs={6} md={3}>
            <Form.Group>
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col xs={12} md="auto">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm("");
                setStartDate("");
                setEndDate("");
              }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="d-flex align-items-center gap-2">
          <Spinner animation="border" />
          <span>Loading files...</span>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : Object.keys(filteredFiles).length === 0 ? (
        <p>No resumes match your filters.</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Resume (.docx)</th>
              <th>Job Description (.txt)</th>
              <th>JD URL</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file, idx) => {
              const currDate = file.date;
              const nextDate = filteredFiles[idx + 1]?.date;
              const isLastOfDate = currDate !== nextDate;

              return (
                <tr key={`${file.name}-${idx}`}>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => secureDownload(file.name, ".docx")}
                    >
                      {file.name}.docx
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => secureDownload(file.name, ".txt")}
                    >
                      {file.name}.txt
                    </Button>
                  </td>
                  <td>
                    {file.jdUrl ? (
                      <a href={file.jdUrl} target="_blank" rel="noreferrer">
                        View JD
                      </a>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>{file.date}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(file.name)}
                    >
                      Delete
                    </Button>

                    {isLastOfDate && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => downloadZip(file.date)}
                        >
                          ⬇️ Download All for {file.date} (Total {dateCounts[file.date] || 0})
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <Form.Group className="mb-3 d-flex justify-content-end align-items-center gap-2">
        <Form.Label className="mb-0">Rows per page:</Form.Label>
        <Form.Select
          size="sm"
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value));
            setPage(1); // reset to first page when limit changes
          }}
          style={{ width: "100px" }}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </Form.Select>
      </Form.Group>
      {totalPages > 1 && (
        <div className="d-flex justify-content-center my-4">
          <Pagination>
            <Pagination.Prev
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            />

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <Pagination.Item
                key={pg}
                active={pg === page}
                onClick={() => setPage(pg)}
              >
                {pg}
              </Pagination.Item>
            ))}

            <Pagination.Next
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            />
          </Pagination>
        </div>
      )}


    </Container>
  );
};

export default Dashboard;
