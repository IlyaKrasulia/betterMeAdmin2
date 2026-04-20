import React from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { LandingKeyframes } from '@features/landing/LandingKeyframes'
import {
  LandingNavbar,
  HeroSection,
  RevenueCalculatorSection,
  HowItWorksSection,
  FeaturesSection,
  ComparisonSection,
  PricingSection,
  FinalCTASection,
} from '@features/landing'

// Force dark background for the landing page regardless of app theme
const LandingGlobal = createGlobalStyle`
  body {
    background: #09090B !important;
    overflow-x: hidden;
  }
  html {
    scroll-behavior: smooth;
  }
`

const Wrapper = styled.div`
  min-height: 100vh;
  background: #09090B;
  overflow-x: hidden;
`

export function LandingPage() {
  return (
    <>
      <LandingKeyframes />
      <LandingGlobal />
      <Wrapper>
        <LandingNavbar />
        <HeroSection />
        <RevenueCalculatorSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ComparisonSection />
        <PricingSection />
        <FinalCTASection />
      </Wrapper>
    </>
  )
}
