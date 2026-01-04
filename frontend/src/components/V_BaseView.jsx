import React, { Component } from 'react';
import { message } from 'antd';

/**
 * V_BaseView - Base view component for all views in the application
 * Implements the View layer from MVC design specification
 */
class V_BaseView extends Component {
  constructor(props) {
    super(props);
    
    // Base view state properties from design
    this.state = {
      title: props.title || '',
      isVisible: props.isVisible !== undefined ? props.isVisible : true,
      currentUserId: props.currentUserId || null,
    };
  }

  /**
   * Show the view
   */
  show() {
    this.setState({ isVisible: true });
  }

  /**
   * Hide the view
   */
  hide() {
    this.setState({ isVisible: false });
  }

  /**
   * Display error message to user
   * @param {string} errorMessage - The error message to display
   */
  displayError(errorMessage) {
    message.error(errorMessage);
    console.error('View Error:', errorMessage);
  }

  /**
   * Display success message to user
   * @param {string} successMessage - The success message to display
   */
  displaySuccess(successMessage) {
    message.success(successMessage);
  }

  /**
   * Display info message to user
   * @param {string} infoMessage - The info message to display
   */
  displayInfo(infoMessage) {
    message.info(infoMessage);
  }

  /**
   * Display warning message to user
   * @param {string} warningMessage - The warning message to display
   */
  displayWarning(warningMessage) {
    message.warning(warningMessage);
  }

  render() {
    if (!this.state.isVisible) {
      return null;
    }

    // Base view renders children by default
    // Subclasses should override this method
    return this.props.children || null;
  }
}

export default V_BaseView;
