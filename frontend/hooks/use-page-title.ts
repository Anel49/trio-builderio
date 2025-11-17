import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";

const COMPANY_NAME = "LendIt";

export const usePageTitle = (dynamicData?: {
  listingName?: string;
  userName?: string;
}) => {
  const location = useLocation();
  const params = useParams();

  useEffect(() => {
    let title = "LendIt";

    const pathname = location.pathname;

    if (pathname === "/") {
      title = `LendIt`;
    } else if (pathname === "/browse") {
      title = `Browse Listings | ${COMPANY_NAME}`;
    } else if (pathname.startsWith("/listing/")) {
      if (dynamicData?.listingName) {
        title = `${dynamicData.listingName} | ${COMPANY_NAME}`;
      } else {
        title = COMPANY_NAME;
      }
    } else if (pathname === "/profile") {
      title = `Your Profile | ${COMPANY_NAME}`;
    } else if (pathname.startsWith("/profile/")) {
      if (dynamicData?.userName) {
        title = `${dynamicData.userName}'s Profile | ${COMPANY_NAME}`;
      } else {
        title = COMPANY_NAME;
      }
    } else if (pathname === "/messages") {
      title = `Messages | ${COMPANY_NAME}`;
    } else if (pathname === "/order-history") {
      title = `Rentals and Requests | ${COMPANY_NAME}`;
    } else if (pathname === "/upload") {
      title = `Listing Creation | ${COMPANY_NAME}`;
    } else if (pathname === "/checkout") {
      title = `Checkout | ${COMPANY_NAME}`;
    } else if (
      pathname === "/terms-of-service" ||
      pathname === "/TermsOfService"
    ) {
      title = `Terms of Service | ${COMPANY_NAME}`;
    } else if (pathname === "/faq") {
      title = `FAQs | ${COMPANY_NAME}`;
    }

    document.title = title;
  }, [location.pathname, dynamicData?.listingName, dynamicData?.userName]);
};
