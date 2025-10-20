import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskAssessmentSection } from '@/components/dashboard/wallet/risk-assessment-section';

describe('RiskAssessmentSection', () => {
  it('should render risk assessment with score', () => {
    render(<RiskAssessmentSection riskScore={25} />);

    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('25/100')).toBeInTheDocument();
  });

  it('should display "Low Risk" label for score < 30', () => {
    render(<RiskAssessmentSection riskScore={15} />);

    expect(screen.getByText('Low Risk')).toBeInTheDocument();
  });

  it('should display "Medium Risk" label for score 30-69', () => {
    render(<RiskAssessmentSection riskScore={50} />);

    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('should display "High Risk" label for score >= 70', () => {
    render(<RiskAssessmentSection riskScore={85} />);

    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('should show green progress bar for low risk', () => {
    const { container } = render(<RiskAssessmentSection riskScore={20} />);

    const progressBar = container.querySelector('.bg-green-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should show yellow progress bar for medium risk', () => {
    const { container } = render(<RiskAssessmentSection riskScore={50} />);

    const progressBar = container.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should show red progress bar for high risk', () => {
    const { container } = render(<RiskAssessmentSection riskScore={80} />);

    const progressBar = container.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('should set progress bar width based on risk score', () => {
    const { container } = render(<RiskAssessmentSection riskScore={65} />);

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '65%' });
  });

  it('should display all risk level labels', () => {
    render(<RiskAssessmentSection riskScore={50} />);

    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
  });

  it('should render AlertTriangle icon', () => {
    const { container } = render(<RiskAssessmentSection riskScore={50} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should handle edge case scores', () => {
    const testCases = [
      { score: 0, expectedLabel: 'Low Risk', expectedColor: 'bg-green-500' },
      { score: 29, expectedLabel: 'Low Risk', expectedColor: 'bg-green-500' },
      { score: 30, expectedLabel: 'Medium Risk', expectedColor: 'bg-yellow-500' },
      { score: 69, expectedLabel: 'Medium Risk', expectedColor: 'bg-yellow-500' },
      { score: 70, expectedLabel: 'High Risk', expectedColor: 'bg-red-500' },
      { score: 100, expectedLabel: 'High Risk', expectedColor: 'bg-red-500' },
    ];

    testCases.forEach(({ score, expectedLabel, expectedColor }) => {
      const { container, unmount } = render(
        <RiskAssessmentSection riskScore={score} />
      );
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
      expect(container.querySelector(`.${expectedColor}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should apply correct badge styling', () => {
    const { container } = render(<RiskAssessmentSection riskScore={50} />);

    const badge = screen.getByText('50/100');
    expect(badge).toHaveClass('text-lg');
    expect(badge).toHaveClass('px-4');
    expect(badge).toHaveClass('py-2');
  });
});
