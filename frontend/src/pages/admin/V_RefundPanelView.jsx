import React from "react";
import { Input, notification } from "antd";
import V_BaseView from "@components/V_BaseView";
import axios from "axios";
import RefundTable from "@components/administrator_page/V_RefundTable";

const { TextArea } = Input;

/**
 * V_RefundPanelView
 * View component for admin refund ticket management
 */
class V_RefundPanelView extends V_BaseView {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      title: "Refund Management",
      pendingTickets: [],
      selectedTicketId: null,
      decision: null,
      adminComment: "",
      isLoading: true,
    };
  }

  /**
   * displayPendingTickets(tickets)
   * Design method: Renders the pending ticket list from controller data
   */
  displayPendingTickets(tickets) {
    this.setState({
      pendingTickets: tickets,
      isLoading: false,
    });
  }

  /**
   * clickSubmitDecision(ticketId, decision, comment)
   * Design method: Sends approve/reject request to controller
   */
  async clickSubmitDecision(ticketId, decision, comment) {
    try {
      const token = localStorage.getItem("accessToken");
      
      // Use the new resolve endpoint
      const response = await axios.patch(
        `http://localhost:8000/refund-tickets/${ticketId}/resolve`,
        {
          decision: decision === "resolved" ? "approved" : decision,
          admin_comments: comment || "Ticket resolved by admin",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const actionText = decision === "approved" ? "approved" : "rejected";
        notification.success({
          message: "Refund Request Resolved",
          description: `Refund request #${ticketId} has been ${actionText}.`,
        });

        // Refresh the data
        this.fetchRefundTickets();
      }
    } catch (error) {
      this.displayError("Failed to resolve refund request");
      console.error("Error resolving refund:", error);
      notification.error({
        message: "Failed to Resolve Refund Request",
        description: error.response?.data?.detail || "Please try again later.",
      });
    }
  }

  /**
   * fetchRefundTickets()
   * Fetch all refund tickets
   */
  async fetchRefundTickets() {
    this.setState({ isLoading: true });
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("http://localhost:8000/refund-tickets/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Refund tickets data:", response.data);
      this.displayPendingTickets(response.data);
    } catch (error) {
      this.displayError("Failed to load refund tickets");
      console.error("Error fetching refund tickets:", error);
      this.setState({ isLoading: false });
    }
  }

  /**
   * onResolve(record, decision, adminComments)
   * Handle resolve action from table
   * decision: "approved" or "rejected"
   * adminComments: optional admin comments string
   */
  onResolve = async (record, decision = "approved", adminComments = "") => {
    await this.clickSubmitDecision(record.id, decision, adminComments);
  };

  componentDidMount() {
    this.fetchRefundTickets();
    this.show();
  }

  render() {
    const { pendingTickets, isLoading } = this.state;

    return (
      <div style={{ paddingTop: "2rem" }}>
        <h2 style={{ marginBottom: "2rem" }}>Refund Tickets</h2>
        {isLoading && <p>Loading...</p>}

        {!isLoading && pendingTickets.length === 0 && <p>No refund requests found.</p>}

        {!isLoading && pendingTickets.length > 0 && (
          <RefundTable data={pendingTickets} onResolve={this.onResolve} />
        )}
      </div>
    );
  }
}

export default V_RefundPanelView;
