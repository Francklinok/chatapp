import React from "react";
import PropTypes from "prop-types";

/**
 * Chrono Component to display the date and time of an event.
 * @param {object} props - The component's properties.
 * @param {Date|string} props.date - The date to display (can be a Date object, Firestore timestamp, or a string).
 * @param {string} [props.locale] - The locale for formatting (optional, defaults to French).
 * @param {boolean} [props.iso8601] - Whether to use ISO 8601 format (optional, unused in current implementation).
 * @return {jsx.Element} A formatted date and time element.
 */

const Chrono = ({ date }) => {
  if (!date) return ""; // If no date is provided, return an empty string.

  // Check if the provided date is a Firestore Timestamp.
  // If yes, convert it to a JavaScript Date object using `.toDate()`.
  // Otherwise, assume it's a valid date string or a Date object.
  const lastSeenDate = date.toDate ? date.toDate() : new Date(date);

  // Use the `Intl.DateTimeFormat` API to format the date into a readable format.
  // The format is set to French (`fr-FR`) with options for year, month, day, hour, and minute.
  const options = new Intl.DateTimeFormat("fr-fr", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(lastSeenDate);

  // Render the formatted date as a span element.
  return <span>{options}</span>;
};

// Define the type and shape of the `date` prop expected by the Chrono component.
// It can be either:
// - An instance of the JavaScript Date object
// - An object (to account for Firestore Timestamp objects)
Chrono.propTypes = {
  date: PropTypes.oneOfType([
    PropTypes.instanceOf(Date), // A standard Date object
    PropTypes.object, // Firestore Timestamp object
  ]),
};

export default Chrono;
