// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import renderRoutes from 'utils/RouterConfig';

import loginFullImage from 'asset/image/login-full.png';
import genestackLogo from 'asset/image/genestackLogo.png';
import styles from './index.less';

export class AuthLayout extends Component {
  constructor(props) {
    super(props);

    this.routes = props.route.routes;
    this.backgroundRef = React.createRef();
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    this.initParallax();
  }

  componentWillUnmount() {
    this.cleanupParallax();
  }

  initParallax = () => {
    if (!this.backgroundRef.current) return;

    const background = this.backgroundRef.current;
    const container = this.containerRef.current;
    let animationId = null;

    // Parallax state
    this.parallaxState = {
      mouseX: 0,
      mouseY: 0,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
    };

    // Desktop: Mouse movement parallax
    const handleMouseMove = (e) => {
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate mouse position relative to center (-1 to 1)
      const mouseX = (e.clientX - rect.left - centerX) / centerX;
      const mouseY = (e.clientY - rect.top - centerY) / centerY;
      
      // Apply subtle movement (max 8px in any direction)
      this.parallaxState.targetX = mouseX * 8;
      this.parallaxState.targetY = mouseY * 8;
    };

    // Mobile: Device orientation parallax
    const handleOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        // Normalize orientation values (-1 to 1)
        const tiltX = Math.max(-1, Math.min(1, e.gamma / 30)); // Left/right tilt
        const tiltY = Math.max(-1, Math.min(1, e.beta / 30));  // Forward/back tilt
        
        // Apply subtle movement (max 6px for mobile)
        this.parallaxState.targetX = tiltX * 6;
        this.parallaxState.targetY = tiltY * 6;
      }
    };

    // Mobile: Scroll parallax as fallback
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
      
      if (maxScroll > 0) {
        const scrollProgress = scrollY / maxScroll;
        // Very subtle scroll parallax (max 4px)
        this.parallaxState.targetY = (scrollProgress - 0.5) * 4;
      }
    };

    // Smooth animation loop for 60fps performance
    const animate = () => {
      const { targetX, targetY, currentX, currentY } = this.parallaxState;
      
      // Smooth interpolation (easing factor for smooth movement)
      const ease = 0.1;
      this.parallaxState.currentX += (targetX - currentX) * ease;
      this.parallaxState.currentY += (targetY - currentY) * ease;
      
      // Apply transform with hardware acceleration
      const translateX = this.parallaxState.currentX;
      const translateY = this.parallaxState.currentY;
      
      background.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(1.05)`;
      
      animationId = requestAnimationFrame(animate);
    };

    // Feature detection and event binding
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile: Try device orientation first, fallback to scroll
      if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleOrientation, { passive: true });
      } else {
        window.addEventListener('scroll', handleScroll, { passive: true });
      }
    } else {
      // Desktop: Mouse movement
      container.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Start animation loop
    animate();

    // Store cleanup functions
    this.parallaxCleanup = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (isMobile) {
        if ('DeviceOrientationEvent' in window) {
          window.removeEventListener('deviceorientation', handleOrientation);
        } else {
          window.removeEventListener('scroll', handleScroll);
        }
      } else {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  };

  cleanupParallax = () => {
    if (this.parallaxCleanup) {
      this.parallaxCleanup();
    }
  };

  render() {
    return (
      <div className={styles.container} ref={this.containerRef}>
        {/* Full-screen background with parallax */}
        <div className={styles.background}>
          <img
            ref={this.backgroundRef}
            alt=""
            className={styles.backgroundImage}
            src={loginFullImage}
          />
          <div className={styles.overlay} />
        </div>

        {/* Left column - Login content */}
        <div className={styles.leftColumn}>
          <div className={styles.cardContainer}>
            {renderRoutes(this.routes)}
          </div>
        </div>

        {/* Right column - Logo and branding */}
        <div className={styles.rightColumn}>
          <div className={styles.brandingContainer}>
            <img alt="logo" className={styles.logo} src={genestackLogo} />
            <h2 className={styles.brandTitle}>Rackspace OpenStack</h2>
            <p className={styles.brandSubtitle}>Powered by OpenCenter</p>
          </div>
        </div>
      </div>
    );
  }
}

export default inject('rootStore')(observer(AuthLayout));
