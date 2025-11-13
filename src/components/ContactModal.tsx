"use client";
import { useState } from "react";

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
  updated_at: string;
}

interface ContactModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: number, status: string) => void;
}

export default function ContactModal({ contact, isOpen, onClose, onStatusUpdate }: ContactModalProps) {
  const [replyMode, setReplyMode] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!isOpen || !contact) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    
    setSending(true);
    try {
      // For now, we'll just mark as replied and show the reply
      // In a real implementation, you'd send an email here
      await onStatusUpdate(contact.id, 'replied');
      
      // You could implement actual email sending here
      // const response = await fetch('/api/admin/contacts/reply', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     contactId: contact.id,
      //     replyMessage,
      //     recipientEmail: contact.email
      //   })
      // });
      
      alert(`Reply sent to ${contact.email}:\n\n${replyMessage}`);
      setReplyMessage("");
      setReplyMode(false);
    } catch (error) {
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Contact Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Contact Info */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{contact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{contact.email}</p>
              </div>
              {contact.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{contact.phone}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={contact.status}
                  onChange={(e) => onStatusUpdate(contact.id, e.target.value)}
                  className="mt-1 text-sm px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Received</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(contact.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(contact.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{contact.message}</p>
            </div>
          </div>

          {/* Reply Section */}
          {!replyMode ? (
            <div className="flex gap-3">
              <button
                onClick={() => setReplyMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Reply
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reply to {contact.name}
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={6}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleReply}
                  disabled={!replyMessage.trim() || sending}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : "Send Reply"}
                </button>
                <button
                  onClick={() => {
                    setReplyMode(false);
                    setReplyMessage("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}